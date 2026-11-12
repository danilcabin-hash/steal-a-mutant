import { balance } from '../config/balance';

const key = 'steal-a-mutant-progress';

interface Save {
  version: 1;
  count: number;
  money: number;
  training: number;
  level: number;
  incubating: boolean;
}

function bounded(value: unknown, max: number) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(0, value)) : 0;
}

export class Progress {
  private data: Save = { version: 1, count: 0, money: 0, training: 0, level: 0, incubating: false };

  constructor(private readonly storage?: Pick<Storage, 'getItem' | 'setItem'>) {
    try {
      const saved = JSON.parse(storage?.getItem(key) ?? 'null') as Partial<Save> | null;
      if (saved?.version !== 1) return;
      const count = Math.floor(bounded(saved.count, balance.income.length));
      this.data = {
        version: 1, count,
        money: bounded(saved.money, Number.MAX_SAFE_INTEGER),
        training: bounded(saved.training, balance.maxTraining),
        level: Math.floor(bounded(saved.level, balance.speedPrices.length)),
        incubating: count < balance.income.length && saved.incubating === true,
      };
    } catch { /* Storage may be disabled or contain invalid data. */ }
  }

  get count() { return this.data.count; }
  get money() { return Math.floor(this.data.money); }
  get training() { return Math.floor(this.data.training); }
  get incubating() { return this.data.incubating; }
  get income() { return balance.income.slice(0, this.count).reduce<number>((sum, value) => sum + value, 0); }
  get price() { return balance.speedPrices[this.data.level]; }
  get speed() {
    return balance.baseSpeed + this.training * balance.trainingBonus + this.data.level * balance.speedBonus;
  }

  update(dt: number, training: boolean) {
    if (training) this.data.training = Math.min(balance.maxTraining, this.data.training + dt * balance.trainingRate);
    this.data.money = Math.min(Number.MAX_SAFE_INTEGER, this.data.money + dt * this.income);
  }

  startIncubation() {
    if (this.count >= balance.income.length || this.incubating) return;
    this.data.incubating = true;
    this.save();
  }

  hatch() {
    if (!this.incubating) return;
    this.data.incubating = false;
    this.data.count++;
    this.save();
  }

  upgrade() {
    const price = this.price;
    if (price === undefined || this.money < price) return;
    this.data.money -= price;
    this.data.level++;
    this.save();
  }

  save() {
    try { this.storage?.setItem(key, JSON.stringify(this.data)); } catch { /* Session can continue in memory. */ }
  }
}
