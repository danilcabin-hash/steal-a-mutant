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
  readonly take = element<HTMLButtonElement>('take');
  readonly resume = element<HTMLButtonElement>('resume');

  update(location: string, raid: Raid) {
    if (this.zone.textContent !== location) this.zone.textContent = location;
    const canTake = raid.canTake;
    if (this.take.hidden === canTake) this.take.hidden = !canTake;
    const alarm = String(raid.carrying);
    if (this.hint.dataset.alarm !== alarm) this.hint.dataset.alarm = alarm;
    const progress = `Мемы ${raid.count} / ${raid.total}`;
    if (this.collection.textContent !== progress) this.collection.textContent = progress;
    let message = 'Все мемы на базе!';
    if (raid.carrying) message = `Тревога! На зелёную площадку базы · ${raid.seconds} с`;
    else if (canTake) message = raid.name!;
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
import type { Raid } from '../progression/Raid';

