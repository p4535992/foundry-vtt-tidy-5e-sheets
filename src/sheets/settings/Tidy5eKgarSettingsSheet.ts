import { FoundryAdapter } from 'src/foundry/foundry-adapter';
import type { SvelteComponent } from 'svelte';
import SettingsSheet from './SettingsSheet.svelte';
import { writable, type Writable } from 'svelte/store';
import {
  getCurrentSettings,
  type CurrentSettings,
  SettingsProvider,
  type Tidy5eSettingKey,
} from 'src/settings/settings';
import { debug } from 'src/utils/logging';
import { Tidy5eCharacterSheet } from '../character/Tidy5eCharacterSheet';
import { Tidy5eKgarItemSheet } from '../item/Tidy5eKgarItemSheet';
import { Tidy5eNpcSheet } from '../npc/Tidy5eNpcSheet';
import { Tidy5eVehicleSheet } from '../vehicle/Tidy5eKgarVehicleSheet';
import { CONSTANTS } from 'src/constants';

export type SettingsSheetFunctions = {
  save(settings: CurrentSettings): Promise<unknown>;
  apply(settings: CurrentSettings): Promise<unknown>;
};

export type SettingsSheetStore = Writable<CurrentSettings>;

declare var FormApplication: any;

export class Tidy5eKgarSettingsSheet extends FormApplication {
  initialTabId: string;

  constructor(initialTabId: string, ...args: any[]) {
    super(...args);
    this.initialTabId = initialTabId ?? CONSTANTS.TAB_SETTINGS_PLAYERS;
  }

  static get defaultOptions() {
    return {
      ...super.defaultOptions,
      height: 750,
      title: FoundryAdapter.localize('T5EK.Settings.SheetMenu.title'),
      width: 750,
      classes: ['tidy5e-kgar', 'settings'],
      submitOnClose: false,
      minimizable: true,
      popOut: true,
      resizable: true,
    };
  }

  get template() {
    return FoundryAdapter.getTemplate('empty-form-template.hbs');
  }

  component: SvelteComponent | undefined;
  activateListeners(html: any) {
    const node = html.get(0);

    this.component = new SettingsSheet({
      target: node,
      props: {
        selectedTabId: this.initialTabId,
      },
      context: new Map<any, any>([
        ['store', writable(getCurrentSettings()) satisfies SettingsSheetStore],
        [
          'functions',
          {
            save: this.saveChangedSettings.bind(this),
            apply: this.applyChangedSettings.bind(this),
          } satisfies SettingsSheetFunctions,
        ],
        ['appId', this.appId]
      ]),
    });
  }

  close(options: unknown = {}) {
    this.component?.$destroy();
    return super.close(options);
  }

  async render(force: boolean, ...args: any[]) {
    if (force) {
      this.component?.$destroy();
      super.render(force, ...args);
      return;
    }

    // TODO: If there's context to refresh, do it here
  }

  async applyChangedSettings(newSettings: CurrentSettings) {
    const keys = Object.keys(SettingsProvider.settings) as Tidy5eSettingKey[];
    let settingsUpdated = false;
    for (let key of keys) {
      const currentValue = SettingsProvider.settings[key].get();
      const newValue = newSettings[key];
      if (currentValue !== newValue) {
        await FoundryAdapter.setGameSetting(key, newValue);
        debug(`Updated ${key} to ${newValue}`);
        settingsUpdated = true;
      }
    }

    if (settingsUpdated) {
      setTimeout(() => {
        this.redrawOpenSheetsTidy5eSheets();
      }, 200);
    }
  }

  async saveChangedSettings(newSettings: CurrentSettings) {
    await this.applyChangedSettings(newSettings);
    this.close();
  }

  async redrawOpenSheetsTidy5eSheets() {
    game.actors
      .filter(
        (a: any) =>
          a.sheet.rendered &&
          (a.sheet instanceof Tidy5eCharacterSheet ||
            a.sheet instanceof Tidy5eNpcSheet ||
            a.sheet instanceof Tidy5eVehicleSheet)
      )
      .map((a: any) => a.sheet.render(true));

    game.items
      .filter(
        (a: any) => a.sheet.rendered && a.sheet instanceof Tidy5eKgarItemSheet
      )
      .map((a: any) => a.sheet.render(true));

    game.actors
      .map((a: any) =>
        a.items.filter(
          (i: any) => i.sheet.rendered && a.sheet instanceof Tidy5eKgarItemSheet
        )
      )
      .flat()
      .map((s: any) => s.render(true));
  }
}
