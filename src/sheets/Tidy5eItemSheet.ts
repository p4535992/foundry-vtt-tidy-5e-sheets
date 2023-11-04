import { CONSTANTS } from 'src/constants';
import { FoundryAdapter } from 'src/foundry/foundry-adapter';
import type { Item5e, ItemSheetContext } from 'src/types/item';
import { get, writable } from 'svelte/store';
import TypeNotFoundSheet from './item/TypeNotFoundSheet.svelte';
import EquipmentSheet from './item/EquipmentSheet.svelte';
import BackpackSheet from './item/BackpackSheet.svelte';
import BackgroundSheet from './item/BackgroundSheet.svelte';
import ClassSheet from './item/ClassSheet.svelte';
import ConsumableSheet from './item/ConsumableSheet.svelte';
import FeatSheet from './item/FeatSheet.svelte';
import LootSheet from './item/LootSheet.svelte';
import SpellSheet from './item/SpellSheet.svelte';
import SubclassSheet from './item/SubclassSheet.svelte';
import ToolSheet from './item/ToolSheet.svelte';
import WeaponSheet from './item/WeaponSheet.svelte';
import type { SheetStats } from 'src/types/types';
import { applyTitleToWindow } from 'src/utils/applications';
import { debug } from 'src/utils/logging';
import { isNil } from 'src/utils/data';
import type { SvelteComponent } from 'svelte';
import { getPercentage } from 'src/utils/numbers';

export class Tidy5eKgarItemSheet extends dnd5e.applications.item.ItemSheet5e {
  context = writable<ItemSheetContext>();
  stats = writable<SheetStats>({
    lastSubmissionTime: null,
  });
  selectedTabId: string;
  advancementConfigurationMode = false;

  constructor(item: Item5e, ...args: any[]) {
    super(item, ...args);

    if (this.object.type === 'class') {
      this.options.width = this.position.width = 600;
      this.options.height = this.position.height = 680;
    } else if (this.object.type === 'subclass') {
      this.options.height = this.position.height = 540;
    }
  }

  get template() {
    return FoundryAdapter.getTemplate('empty-form-template-for-items.hbs');
  }

  static get defaultOptions() {
    return FoundryAdapter.mergeObject(super.defaultOptions, {
      classes: ['tidy5e-kgar', 'sheet', 'item'],
    });
  }

  component: SvelteComponent | undefined;
  activateListeners(html: any) {
    // Legacy jquery / form application change handling; will probably have to fix this further in the future
    html.on('change', 'input[name], textarea[name], select[name]', () => {
      this.submit();
    });

    const node = html.get(0);

    const stores = new Map<any, any>([
      ['context', this.context],
      ['stats', this.stats],
    ]);

    switch (this.item.type) {
      case CONSTANTS.ITEM_TYPE_EQUIPMENT:
        this.component = new EquipmentSheet({
          target: node,
          props: {
            selectedTabId: this.selectedTabId ?? 'description',
          },
          context: stores,
        });
        break;
      case CONSTANTS.ITEM_TYPE_BACKGROUND:
        this.component = new BackgroundSheet({
          target: node,
          props: {
            selectedTabId: this.selectedTabId ?? 'description',
          },
          context: stores,
        });
        break;
      case CONSTANTS.ITEM_TYPE_BACKPACK:
        this.component = new BackpackSheet({
          target: node,
          props: {
            selectedTabId: this.selectedTabId ?? 'description',
          },
          context: stores,
        });
        break;
      case CONSTANTS.ITEM_TYPE_CLASS:
        this.component = new ClassSheet({
          target: node,
          props: {
            selectedTabId: this.selectedTabId ?? 'description',
          },
          context: stores,
        });
        break;
      case CONSTANTS.ITEM_TYPE_CONSUMABLE:
        this.component = new ConsumableSheet({
          target: node,
          props: {
            selectedTabId: this.selectedTabId ?? 'description',
          },
          context: stores,
        });
        break;
      case CONSTANTS.ITEM_TYPE_FEAT:
        this.component = new FeatSheet({
          target: node,
          props: {
            selectedTabId: this.selectedTabId ?? 'description',
          },
          context: stores,
        });
        break;
      case CONSTANTS.ITEM_TYPE_LOOT:
        this.component = new LootSheet({
          target: node,
          props: {
            selectedTabId: this.selectedTabId ?? 'description',
          },
          context: stores,
        });
        break;
      case CONSTANTS.ITEM_TYPE_SPELL:
        this.component = new SpellSheet({
          target: node,
          props: {
            selectedTabId: this.selectedTabId ?? 'description',
          },
          context: stores,
        });
        break;
      case CONSTANTS.ITEM_TYPE_SUBCLASS:
        this.component = new SubclassSheet({
          target: node,
          props: {
            selectedTabId: this.selectedTabId ?? 'description',
          },
          context: stores,
        });
        break;
      case CONSTANTS.ITEM_TYPE_TOOL:
        this.component = new ToolSheet({
          target: node,
          props: {
            selectedTabId: this.selectedTabId ?? 'description',
          },
          context: stores,
        });
        break;
      case CONSTANTS.ITEM_TYPE_WEAPON:
        this.component = new WeaponSheet({
          target: node,
          props: {
            selectedTabId: this.selectedTabId ?? 'description',
          },
          context: stores,
        });
        break;
      default:
        this.component = new TypeNotFoundSheet({
          target: node,
          context: stores,
        });
        break;
    }

    node
      .querySelectorAll<HTMLElement>(`.${CONSTANTS.TAB_OPTION_CLASS}`)
      .forEach((tab) => {
        tab.addEventListener(
          'click',
          (event: MouseEvent & { currentTarget: HTMLElement }) => {
            const tabId = event.currentTarget.dataset.tabId;
            this.makeWindowAutoHeightForDetailsTab(tabId);
            this.#cacheSelectedTabId();
          }
        );
      });

    // Advancement context menu
    const contextOptions = this._getAdvancementContextMenuOptions();
    /**
     * A hook event that fires when the context menu for the advancements list is constructed.
     * @function dnd5e.getItemAdvancementContext
     * @memberof hookEvents
     * @param {jQuery} html                      The HTML element to which the context options are attached.
     * @param {ContextMenuEntry[]} entryOptions  The context menu entries.
     */
    FoundryAdapter.hooksCall(
      'dnd5e.getItemAdvancementContext',
      html,
      contextOptions
    );
    if (contextOptions)
      new ContextMenu(html, '.advancement-item', contextOptions);
  }

  async getData(options = {}) {
    this.context.set(await this.getContext());
    return get(this.context);
  }

  private makeWindowAutoHeightForDetailsTab(tabId: string | undefined) {
    if (tabId === CONSTANTS.TAB_ITEM_DETAILS_ID) {
      const scrollTop = this.element
        ?.get(0)
        ?.querySelector(
          `[data-tab-contents-for="${CONSTANTS.TAB_ITEM_DETAILS_ID}"]`
        )?.scrollTop;
      this.setPosition({
        height: 'auto',
      });
      if (scrollTop) {
        const adjustedApplication = this.element
          ?.get(0)
          ?.querySelector(
            `[data-tab-contents-for="${CONSTANTS.TAB_ITEM_DETAILS_ID}"]`
          );
        if (adjustedApplication) {
          adjustedApplication.scrollTop = scrollTop;
        }
      }
    }
  }

  // TODO: Extract this implementation somewhere. Or at least part of it.
  render(force = false, options = {}) {
    if (force) {
      this.component?.$destroy();
      super.render(force, options);
      this.makeWindowAutoHeightForDetailsTab(this.selectedTabId);
      return this;
    }

    applyTitleToWindow(this.title, this.element.get(0));
    this.updateContext().then(() => {
      setTimeout(() => {
        this.makeWindowAutoHeightForDetailsTab(this.selectedTabId);
      });
    });
    return this;
  }

  private async updateContext() {
    const context = await this.getContext();
    this.context.update(() => context);
  }

  private async getContext(): Promise<ItemSheetContext> {
    const context = {
      ...(await super.getData(this.options)),
      appId: this.appId,
      activateFoundryJQueryListeners: (node: HTMLElement) => {
        this._activateCoreListeners($(node));
        super.activateListeners($(node));
      },
      toggleAdvancementLock: this.toggleAdvancementLock.bind(this),
      lockItemQuantity: FoundryAdapter.shouldLockItemQuantity(),
      healthPercentage: getPercentage(
        this.item?.system?.hp?.value,
        this.item?.system?.hp?.max
      ),
    };

    debug(`${this.item?.type ?? 'Unknown Item Type'} context data`, context);

    return context;
  }

  async _onSubmit(...args: any[]) {
    await super._onSubmit(...args);

    // TODO: Figure out why multiple render calls is trashing the prose editor.
    // This setTimeout() is making it so the item prose editors don't go nonresponsive.
    // I think it may have something to do with Save -> Trigger Component Refresh (onSubmit) -> Render -> Trash Prose Editor HTML -> Render again
    setTimeout(() => {
      this.stats.update((stats) => {
        stats.lastSubmissionTime = new Date();
        return stats;
      });
    });
  }

  close(...args: any[]) {
    try {
      this._saveViewState();
    } catch (e) {
      debug(
        `Unable to save view state for ${Tidy5eKgarItemSheet.name}. Ignoring.`
      );
    } finally {
      this.component?.$destroy();
      return super.close(...args);
    }
  }

  protected _saveViewState() {
    /*
      TODO: Save any state that needs to be restored to this sheet instance for rehydration on refresh.
      - Currently Selected Tab
      - Scroll Top of all scrollable areas + the tab they represent
      - Expanded entity IDs
      - Focused input element

      To do this save operation, use query selectors and data-attributes to target the appropriate things to save.
      Can it be made general-purpose? Or should it be more bespoke?
    */
    this.#cacheSelectedTabId();
  }

  #cacheSelectedTabId() {
    const selectedTabId = this.element
      ?.get(0)
      ?.querySelector(`.${CONSTANTS.TAB_OPTION_CLASS}.active`)?.dataset?.tabId;

    if (!isNil(selectedTabId, '')) {
      this.selectedTabId = selectedTabId;
    }

    /* 
      While Tidy 5e does its own thing with tabs, 
      this active tab assignment is required in order 
      to make item dropping tab-aware.
    */
    this._tabs[0].active = this.selectedTabId;
  }

  async _onDropSingleItem(...args: any[]) {
    this.#cacheSelectedTabId();
    return super._onDropSingleItem(...args);
  }

  async toggleAdvancementLock() {
    this.advancementConfigurationMode = !this.advancementConfigurationMode;
    await this.updateContext();
  }

  _getHeaderButtons() {
    const buttons = super._getHeaderButtons();

    return FoundryAdapter.removeConfigureSettingsButtonWhenLockedForNonGm(
      buttons
    );
  }
}