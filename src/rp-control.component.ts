import {
  Component,
  Input,
  ContentChild,
  Renderer,
  ViewEncapsulation,
  ElementRef,
  HostBinding,
  Optional,
  OnInit,
  AfterContentInit,
  SkipSelf,
} from '@angular/core';
import {FormControl, FormControlName} from '@angular/forms';
import {castArray, compact, concat, defaultTo, flatten, flow, forEach, isEmpty, map, uniqueId} from 'lodash/fp';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {ReplaySubject} from 'rxjs/ReplaySubject';
import 'rxjs/add/operator/map';

import {RpControlsSettingsService} from './rp-controls-settings.service';
import {RpFormGroupDirective} from './rp-form-group.directive';

// TODO Should '.is-disabled' be part of this?
// - Probably - all fields can be disabled
@Component({
  selector: 'rp-control',
  styles: [`
    /* Bare minimum / Reset */
    fieldset {
      padding: 0;
      border: 0;
    }

    /* Placecholders */
    ::placeholder {
      color: rgba(0, 0, 0, 0.4);
    }
    ::-webkit-input-placeholder { /* WebKit, Blink, Edge */
      color: rgba(0, 0, 0, 0.4);
    }
    :-moz-placeholder { /* Mozilla Firefox 4 to 18 */
      color: rgba(0, 0, 0, 0.4);
    }
    ::-moz-placeholder { /* Mozilla Firefox 19+ */
      color: rgba(0, 0, 0, 0.4);
    }
    :-ms-input-placeholder { /* Internet Explorer 10-11 */
      color: rgba(0, 0, 0, 0.4);
    }
    ::-webkit-datetime-edit-fields-wrapper {
      color: rgba(0, 0, 0, 0.4);
    }

    .dropdown label { /* Here for viewEncapsulation: 'none' */
      display: block;
      white-space: nowrap;
    }

    .dropdown rp-checkbox-control {
      display: inline-block;
    }
  `],
  template: `
    <label *ngIf="label" [attr.for]="id|async" class="rp-control__label">{{label}}</label>

    <div class="rp-control__input-container">
      <ng-content></ng-content>
    </div>

    <rp-control-errors
      *ngIf="!rpControl && (touched || (showErrors$|async))"
      [errors]="control?.errors"
      [messages]="errors"
    ></rp-control-errors>
  `,
  encapsulation: ViewEncapsulation.None,
})
export class RpControlComponent implements OnInit, AfterContentInit {
  @Input() label: string;

  @Input() types = [];

  // TODO Might need to check for empty ({}, null) values
  // - Could be done with getter / setter?
  @Input() @HostBinding('class.has-value') value: any;

  @Input() @HostBinding('class.has-focus') hasFocus: boolean;

  @Input() @HostBinding('class.was-touched') touched: boolean;

  @Input() @HostBinding('class.is-disabled') disabled = false;

  @Input() errors = {};

  @ContentChild('rpControlInput') input;

  id = new ReplaySubject(1);

  control: FormControl;

  showErrors$: BehaviorSubject<boolean>;

  constructor(
    private renderer: Renderer,
    private settings: RpControlsSettingsService,
    private el: ElementRef,
    @Optional() private formControl: FormControl,
    @Optional() private formControlName: FormControlName,
    @Optional() private rpFormGroup: RpFormGroupDirective,
    @Optional() @SkipSelf() private rpControl: RpControlComponent // Exists if <rp-control> is nested under another <rp-control>
  ) {}

  ngOnInit() {
    this.control = this.formControlName ? this.formControlName.control : this.formControl || new FormControl();

    // TODO This was added without much testing.
    // - Does this still work with parent FormGroup?
    // - Would errors show up with just a FormControl?
    if (this.rpFormGroup) {
      this.showErrors$ = this.rpFormGroup.showErrors$;
    }
  }

  ngAfterContentInit() {
    if (this.input) {
      const {type, id: elId} = this.input.nativeElement;

      // Add ID to input
      const id = elId || uniqueId('rp-control-');
      this.id.next(id);
      this.renderer.setElementAttribute(this.input.nativeElement, 'id', id);

      // Add class to input
      this.renderer.setElementClass(this.input.nativeElement, 'rp-control__input', true);
    }

    // Add classes to host
    if (!isEmpty(this.settings.themes)) {
      flow(
        defaultTo([]),
        concat(castArray(this.types)),
        flatten,
        compact,
        map(x => `rp-control--${x}`),
        forEach((x) => this.renderer.setElementClass(this.el.nativeElement, x, true))
      )(this.settings.themes);
    }
  }
}
