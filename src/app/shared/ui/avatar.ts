import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Member } from '../../core/models/board.models';

@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.background]': 'member().color',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
    '[style.font-size.px]': 'size() * 0.42',
    '[attr.title]': 'member().name',
    role: 'img',
    '[attr.aria-label]': 'member().name',
  },
  template: `{{ initials() }}`,
  styles: `
    :host {
      display: inline-grid;
      place-items: center;
      flex-shrink: 0;
      border-radius: 50%;
      color: #fff;
      font-weight: 600;
      letter-spacing: 0.02em;
      user-select: none;
    }
  `,
})
export class AvatarComponent {
  readonly member = input.required<Member>();
  readonly size = input(26);

  protected readonly initials = computed(() =>
    this.member()
      .name.split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase(),
  );
}
