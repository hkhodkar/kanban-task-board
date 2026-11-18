import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  CardFilters,
  DueFilter,
  EMPTY_FILTERS,
  Label,
  Member,
} from '../../core/models/board.models';
import { hasActiveFilters } from '../../core/utils/card.utils';
import { IconComponent } from '../../shared/ui/icon';

@Component({
  selector: 'app-board-filters',
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './board-filters.html',
  styleUrl: './board-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardFiltersComponent {
  readonly filters = input.required<CardFilters>();
  readonly labels = input.required<Label[]>();
  readonly members = input.required<Member[]>();
  readonly matching = input(0);
  readonly total = input(0);
  readonly filtersChange = output<CardFilters>();

  /** the select row is collapsible on small screens */
  protected readonly expanded = signal(false);
  protected readonly active = computed(() => hasActiveFilters(this.filters()));
  protected readonly selectCount = computed(() => {
    const { labelId, assigneeId, due } = this.filters();
    return [labelId, assigneeId, due !== 'all' ? due : null].filter(Boolean).length;
  });

  protected readonly form = inject(NonNullableFormBuilder).group({
    search: [''],
    labelId: [''],
    assigneeId: [''],
    due: ['all' as DueFilter],
  });

  constructor() {
    // keep the form in sync when filters are reset from outside
    effect(() => {
      const filters = this.filters();
      this.form.setValue(
        {
          search: filters.search,
          labelId: filters.labelId ?? '',
          assigneeId: filters.assigneeId ?? '',
          due: filters.due,
        },
        { emitEvent: false },
      );
    });

    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      const value = this.form.getRawValue();
      this.filtersChange.emit({
        search: value.search,
        labelId: value.labelId || null,
        assigneeId: value.assigneeId || null,
        due: value.due,
      });
    });
  }

  protected toggleExpanded(): void {
    this.expanded.update((expanded) => !expanded);
  }

  protected clear(): void {
    this.filtersChange.emit(EMPTY_FILTERS);
  }
}
