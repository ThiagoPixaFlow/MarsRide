import { WALLET_CONFIG } from "@/config/app.config";
import { UserProfile } from "@/modules/users/user.types";
import { Wallet, WalletTransaction } from "@/modules/wallet/wallet.types";
import { Ride, RideCandidateAttempt, RideEvent } from "@/modules/rides/ride.types";
import { RideMessage } from "@/modules/chat/chat.types";
import { Vehicle } from "@/modules/vehicles/vehicle.types";
import { VEHICLES_SEED } from "@/mocks/data/vehicles";
import { createId } from "@/lib/id";

const STORAGE_KEYS = {
  CURRENT_USER_ID: "redride_current_user_id",
  USERS: "redride_users",
  WALLETS: "redride_wallets",
  WALLET_TRANSACTIONS: "redride_wallet_transactions",
  RIDES: "redride_rides",
  RIDE_ATTEMPTS: "redride_ride_attempts",
  RIDE_EVENTS: "redride_ride_events",
  RIDE_MESSAGES: "redride_ride_messages",
  VEHICLES: "redride_vehicles",
} as const;

export interface StoredUserAccount {
  id: string;
  name: string;
  username: string;
  email: string;
  passwordHash: string; // Fictício
  profile: UserProfile;
}

// Usuário padrão demonstrativo
const DEMO_USER: StoredUserAccount = {
  id: "usr_alex_vance",
  name: "Alex Vance",
  username: "alex.mars",
  email: "alex@redride.mars",
  passwordHash: "demo123",
  profile: {
    id: "usr_alex_vance",
    name: "Alex Vance",
    username: "alex.mars",
    email: "alex@redride.mars",
    avatarColor: "#e2602c",
    occupation: "Pesquisador de Geofísica",
    homeLocationId: "loc-residential",
    preferences: {
      preferredCategory: "go",
      conversationLevel: "balanced",
      cabinTemperature: 21,
      music: "ambient",
      accessibleBoarding: false,
    },
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

const DEMO_WALLET: Wallet = {
  id: "wal_alex_vance",
  userId: "usr_alex_vance",
  balance: WALLET_CONFIG.initialBalance,
  currency: WALLET_CONFIG.currency,
  updatedAt: new Date().toISOString(),
};

const DEMO_TRANSACTION: WalletTransaction = {
  id: "tx_welcome_credit",
  walletId: "wal_alex_vance",
  rideId: null,
  type: "initial_credit",
  amount: WALLET_CONFIG.initialBalance,
  balanceAfter: WALLET_CONFIG.initialBalance,
  description: "Créditos de boas-vindas à colônia Nova Acidália",
  createdAt: DEMO_USER.profile.createdAt,
};

class MockStorage {
  private isBrowser(): boolean {
    return typeof window !== "undefined" && typeof localStorage !== "undefined";
  }

  private getItem<T>(key: string, defaultValue: T): T {
    if (!this.isBrowser()) return defaultValue;
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("Falha ao salvar no localStorage", e);
    }
  }

  init() {
    if (!this.isBrowser()) return;

    // Inicializa Usuários se vazio
    const users = this.getItem<Record<string, StoredUserAccount>>(STORAGE_KEYS.USERS, {});
    if (!users[DEMO_USER.id]) {
      users[DEMO_USER.id] = DEMO_USER;
      this.setItem(STORAGE_KEYS.USERS, users);
    }

    // Inicializa Carteiras se vazio
    const wallets = this.getItem<Record<string, Wallet>>(STORAGE_KEYS.WALLETS, {});
    if (!wallets[DEMO_USER.id]) {
      wallets[DEMO_USER.id] = DEMO_WALLET;
      this.setItem(STORAGE_KEYS.WALLETS, wallets);
    }

    // Inicializa Transações
    const txs = this.getItem<WalletTransaction[]>(STORAGE_KEYS.WALLET_TRANSACTIONS, []);
    if (txs.length === 0) {
      this.setItem(STORAGE_KEYS.WALLET_TRANSACTIONS, [DEMO_TRANSACTION]);
    }

    // Inicializa Veículos se vazio
    const vehicles = this.getItem<Vehicle[]>(STORAGE_KEYS.VEHICLES, []);
    if (vehicles.length === 0) {
      this.setItem(STORAGE_KEYS.VEHICLES, VEHICLES_SEED);
    }

    // Se nenhum usuário logado, loga Alex Vance por conveniência
    const currentUserId = this.getItem<string | null>(STORAGE_KEYS.CURRENT_USER_ID, null);
    if (!currentUserId) {
      this.setItem(STORAGE_KEYS.CURRENT_USER_ID, DEMO_USER.id);
    }
  }

  // --- Auth & Session ---
  getCurrentUserId(): string | null {
    return this.getItem<string | null>(STORAGE_KEYS.CURRENT_USER_ID, DEMO_USER.id);
  }

  setCurrentUserId(id: string | null): void {
    this.setItem(STORAGE_KEYS.CURRENT_USER_ID, id);
    if (this.isBrowser()) {
      if (id) {
        document.cookie = `redride_session_hint=${id}; path=/; max-age=2592000; SameSite=Lax`;
      } else {
        document.cookie = `redride_session_hint=; path=/; max-age=0; SameSite=Lax`;
      }
    }
  }

  getAllUsers(): Record<string, StoredUserAccount> {
    return this.getItem<Record<string, StoredUserAccount>>(STORAGE_KEYS.USERS, { [DEMO_USER.id]: DEMO_USER });
  }

  getUserById(id: string): StoredUserAccount | null {
    const users = this.getAllUsers();
    return users[id] || null;
  }

  getUserByEmail(email: string): StoredUserAccount | null {
    const users = this.getAllUsers();
    const cleanEmail = email.toLowerCase().trim();
    for (const user of Object.values(users)) {
      if (user.email.toLowerCase().trim() === cleanEmail) {
        return user;
      }
    }
    return null;
  }

  saveUser(account: StoredUserAccount): void {
    const users = this.getAllUsers();
    users[account.id] = account;
    this.setItem(STORAGE_KEYS.USERS, users);
  }

  // --- Wallet ---
  getWalletByUserId(userId: string): Wallet {
    const wallets = this.getItem<Record<string, Wallet>>(STORAGE_KEYS.WALLETS, {});
    if (wallets[userId]) return wallets[userId];

    // Cria carteira nova com saldo de boas-vindas
    const newWallet: Wallet = {
      id: createId("wal"),
      userId,
      balance: WALLET_CONFIG.initialBalance,
      currency: WALLET_CONFIG.currency,
      updatedAt: new Date().toISOString(),
    };
    wallets[userId] = newWallet;
    this.setItem(STORAGE_KEYS.WALLETS, wallets);

    this.addTransaction({
      id: createId("tx"),
      walletId: newWallet.id,
      rideId: null,
      type: "initial_credit",
      amount: WALLET_CONFIG.initialBalance,
      balanceAfter: WALLET_CONFIG.initialBalance,
      description: "Créditos de boas-vindas à colônia Nova Acidália",
      createdAt: new Date().toISOString(),
    });

    return newWallet;
  }

  saveWallet(wallet: Wallet): void {
    const wallets = this.getItem<Record<string, Wallet>>(STORAGE_KEYS.WALLETS, {});
    wallets[wallet.userId] = { ...wallet, updatedAt: new Date().toISOString() };
    this.setItem(STORAGE_KEYS.WALLETS, wallets);
  }

  getTransactions(walletId?: string): WalletTransaction[] {
    const all = this.getItem<WalletTransaction[]>(STORAGE_KEYS.WALLET_TRANSACTIONS, []);
    if (!walletId) return all;
    return all.filter((t) => t.walletId === walletId);
  }

  addTransaction(tx: WalletTransaction): void {
    const txs = this.getItem<WalletTransaction[]>(STORAGE_KEYS.WALLET_TRANSACTIONS, []);
    txs.unshift(tx);
    this.setItem(STORAGE_KEYS.WALLET_TRANSACTIONS, txs);
  }

  // --- Vehicles ---
  getVehicles(): Vehicle[] {
    return this.getItem<Vehicle[]>(STORAGE_KEYS.VEHICLES, VEHICLES_SEED);
  }

  saveVehicles(vehicles: Vehicle[]): void {
    this.setItem(STORAGE_KEYS.VEHICLES, vehicles);
  }

  // --- Rides ---
  getRides(): Ride[] {
    return this.getItem<Ride[]>(STORAGE_KEYS.RIDES, []);
  }

  getRideById(id: string): Ride | null {
    const rides = this.getRides();
    return rides.find((r) => r.id === id) || null;
  }

  saveRide(ride: Ride): void {
    const rides = this.getRides();
    const index = rides.findIndex((r) => r.id === ride.id);
    if (index >= 0) {
      rides[index] = ride;
    } else {
      rides.unshift(ride);
    }
    this.setItem(STORAGE_KEYS.RIDES, rides);
  }

  // --- Attempts ---
  getAttempts(rideId: string): RideCandidateAttempt[] {
    const attempts = this.getItem<RideCandidateAttempt[]>(STORAGE_KEYS.RIDE_ATTEMPTS, []);
    return attempts.filter((a) => a.rideId === rideId);
  }

  saveAttempt(attempt: RideCandidateAttempt): void {
    const attempts = this.getItem<RideCandidateAttempt[]>(STORAGE_KEYS.RIDE_ATTEMPTS, []);
    const idx = attempts.findIndex((a) => a.id === attempt.id);
    if (idx >= 0) {
      attempts[idx] = attempt;
    } else {
      attempts.push(attempt);
    }
    this.setItem(STORAGE_KEYS.RIDE_ATTEMPTS, attempts);
  }

  // --- Events ---
  getEvents(rideId: string): RideEvent[] {
    const events = this.getItem<RideEvent[]>(STORAGE_KEYS.RIDE_EVENTS, []);
    return events.filter((e) => e.rideId === rideId);
  }

  addEvent(event: RideEvent): void {
    const events = this.getItem<RideEvent[]>(STORAGE_KEYS.RIDE_EVENTS, []);
    events.push(event);
    this.setItem(STORAGE_KEYS.RIDE_EVENTS, events);
  }

  // --- Messages ---
  getMessages(rideId: string): RideMessage[] {
    const messages = this.getItem<RideMessage[]>(STORAGE_KEYS.RIDE_MESSAGES, []);
    return messages.filter((m) => m.rideId === rideId);
  }

  saveMessage(message: RideMessage): void {
    const messages = this.getItem<RideMessage[]>(STORAGE_KEYS.RIDE_MESSAGES, []);
    const idx = messages.findIndex((m) => m.id === message.id);
    if (idx >= 0) {
      messages[idx] = message;
    } else {
      messages.push(message);
    }
    this.setItem(STORAGE_KEYS.RIDE_MESSAGES, messages);
  }
}

export const mockStorage = new MockStorage();
