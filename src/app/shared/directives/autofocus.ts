import { Directive, ElementRef, afterNextRender, inject } from '@angular/core';

/** Focuses the element once it is rendered (and selects text in inputs). */
@Directive({ selector: '[appAutofocus]' })
export class AutofocusDirective {
  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    afterNextRender(() => {
      element.focus();
      if (element instanceof HTMLInputElement) {
        element.select();
      }
    });
  }
}
