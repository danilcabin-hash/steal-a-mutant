import type { Raid } from '../progression/Raid';
import { balance } from '../config/balance';

export function element<T extends HTMLElement>(id: string) {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing UI element: ${id}`);
  return node as T;
}

export class Hud {
  private readonly zone = element('zone');
  private readonly hint = element('hint');
  private readonly notice = element('notice');
  private readonly title = element('notice-title');
  private readonly body = element('notice-body');
  private readonly collection = element('collection');
  private readonly roster = element('roster');
  private readonly wallet = element('wallet');
  private readonly training = element('training');
  readonly upgrade = element<HTMLButtonElement>('upgrade');
  readonly take = element<HTMLButtonElement>('take');
  readonly resume = element<HTMLButtonElement>('resume');

  update(location: string, raid: Raid, onPad: boolean) {
    if (this.zone.textContent !== location) this.zone.textContent = location;
    const canTake = raid.canTake;
    if (this.take.hidden === canTake) this.take.hidden = !canTake;
    const alarm = String(raid.carrying);
    if (this.hint.dataset.alarm !== alarm) this.hint.dataset.alarm = alarm;
    const progress = `Мемы ${raid.count} / ${raid.total}`;
    if (this.collection.textContent !== progress) {
      this.collection.textContent = progress;
      this.roster.textContent = raid.collection.join(' · ');
    }
    const stats = raid.progress;
    const wallet = `${stats.money} монет · +${stats.income}/с`;
    if (this.wallet.textContent !== wallet) this.wallet.textContent = wallet;
    const training = `Тренировка ${stats.training} / ${balance.maxTraining}`;
    if (this.training.textContent !== training) this.training.textContent = training;
    this.upgrade.hidden = location !== 'База';
    this.upgrade.disabled = stats.price === undefined || stats.money < stats.price;
    const upgrade = stats.price === undefined ? 'Скорость улучшена' : `Скорость · ${stats.price} монет`;
    if (this.upgrade.textContent !== upgrade) this.upgrade.textContent = upgrade;
    let message = 'Все мемы на базе!';
    if (raid.carrying) message = `${location === 'База' ? 'Донеси до инкубатора' : 'Беги на базу!'} · ${raid.seconds} с`;
    else if (raid.hatching) message = `Инкубатор · ${raid.name} · ${raid.hatching} с`;
    else if (raid.failed) message = raid.failed;
    else if (canTake) message = raid.name!;
    else if (onPad) message = 'Двигайся по дорожке, чтобы набрать скорость';
    else if (raid.name) message = `Найди в лаборатории: ${raid.name}`;
    if (this.hint.textContent !== message) this.hint.textContent = message;
  }

  show(title: string, body: string, canResume = false) {
    this.title.textContent = title;
    this.body.textContent = body;
    this.resume.hidden = !canResume;
    this.notice.hidden = false;
  }

  hide() {
    this.notice.hidden = true;
  }
}

