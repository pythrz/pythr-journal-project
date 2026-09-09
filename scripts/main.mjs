const {JournalEntryPageProseMirrorSheet} = foundry.applications.sheets.journal;
const cssclasses = ["pythr", "dnd5e2", "dnd5e2-journal", "titlebar", "dialog-lg"];
const numeral = {1: 'i', 2: "ii", 3: "iii", 4: "iv", 5: "v"}
const { DialogV2 } = foundry.applications.api;

const MODULE_ID = "pythr-journal-project";
const completed_key = "completedFlag";
const collapse_key = "collapsedFlag";
const button_flags_key = "buttonStateFlags";
const location_letter_key = "locationCharFlag";
const completed_options = [
	{ value: 3, label: "Undecided" },
	{ value: 4, label: "N/A" },
	{ value: 0, label: "Not Started" }, 
	{ value: 1, label: "Active Event" },
	{ value: 2, label: "Completed" },
	{ value: 5, label: "Failed" }
]
const status_colours = {0: "#ff4f4f", 1: "#ceb833", 2: "#33ce40", 5: "#3f3f40"}
let theatre_inserts_active = false;

const PYTHR_STYLES = {
  advice: { class: "fvtt advice", icon: "icons/magic/symbols/clover-luck-white-green.webp"},
  quest: {
    class: "fvtt quest",
    icon: "icons/magic/symbols/question-stone-yellow.webp",
  },
  treasure: {
    class: "fvtt quest",
	icon: "icons/commodities/currency/coins-leather-pouch-stone.webp"
  },
  encounter: {
	  class: "fvtt quest",
	  icon: "icons/magic/symbols/rune-sigil-hook-white-red.webp",
  },
  narrative: { class: "fvtt narrative", type: "div" },
  notable: { class: "notable", type: "aside" },
  milestone: {
	  class: "fvtt quest",
	  icon: "icons/magic/symbols/star-solid-gold.webp",
  },
  development: {
	  class: "fvtt quest",
	  icon: "icons/sundries/books/book-open-brown-black.webp"
  }
};

Hooks.on("init", () => {	
	const doc = foundry.applications.apps.DocumentSheetConfig;

	doc.registerSheet(JournalEntry, "pythr-journal-project", PythrJournal, {
		types: ["base"],
		label: "Pythr Journal Entry",
		makeDefault: false
	});
	
	doc.registerSheet(JournalEntry, "pythr-journal-project", PythrLocationJournal, {
		types: ["base"],
		label: "Pythr Location Entry",
		makeDefault: false
	});
	
	doc.registerSheet(JournalEntryPage, "pythr-journal-project", PythrSheet, {
		makeDefault: true,
		label: "Pythr Sheet",
		types: ["base"]
	});
	
	game.settings.register(MODULE_ID, "tocEventStyle", {
		name: "TOC Event Status Style",
		hint: "TOC Styling that Represents Event Status",
		scope: "world",
		config: true,
		default: 2,
		type: Number,
		choices: {
			0: "None",
			1: "Border",
			2: "Coloured Tab"
		}
	})
	
	theatre_inserts_active = game.modules.get("theatre")?.active ?? false;
	
	console.warn(`${MODULE_ID} => Main script initialized`);
});

Hooks.on("getProseMirrorMenuDropDowns", (menu, items) => {
    const wrapIn = foundry.prosemirror.commands.wrapIn;
    if ("format" in items) {
        items.format.entries.push({
            action: "pythr",
            title: "Pythr Journals",
            children: [
                {
                    action: "pjp_narrative",
                    title: "Narrative",
                    node: menu.schema.nodes.div,
                    attrs: { class: "fvtt narrative" },
                    cmd: () => {
                        menu._toggleBlock(menu.schema.nodes.div, wrapIn, {
                            attrs: { _preserve: { class: "fvtt narrative" } },
                        });
                        return true;
                    },
                },
				{
					action: "pjp_encounter",
					title: "Encounter ☍",
					node: menu.schema.nodes.div,
					cmd: () => {
						const { schema } = menu;
						const divNode = schema.nodes.div.create(
							{ _preserve: { class: "fvtt quest", "data-button-id": Math.random().toString(36).slice(2), "data-button-type": "encounter" } },
							[
								schema.nodes.figure.create({ _preserve: { class: "icon" } }, [
									schema.nodes.image.create({
										src: PYTHR_STYLES.encounter.icon,
										_preserve: { class: "round" },
									}),
								]),
								schema.nodes.aside.create({ _preserve: { class: "encounter" } }, [
									schema.nodes.paragraph.create(
										null,
										schema.text("Combatants")
									),
									schema.nodes.ordered_list.create(null, schema.nodes.list_item.create(null, schema.text("Combatant (xN)")))
								]),
								schema.nodes.article.create(null, [
									schema.nodes.heading.create(
										{ level: 4 },
										schema.text("Encounter"),
									)
								]),
								schema.nodes.paragraph.create(
									null,
									schema.text("This is an encounter block."),
								),
							]
						);
						menu.view.dispatch(menu.view.state.tr.replaceSelectionWith(divNode));
						return true;
					}
				},
				{
					action: "pjp_development",
					title: "Development ☍",
					node: menu.schema.nodes.div,
					cmd: () => {
						const { schema } = menu;
						const divNode = schema.nodes.div.create(
							{ _preserve: { class: "fvtt quest", "data-button-id": Math.random().toString(36).slice(2), "data-button-type": "development" } },
							[
								schema.nodes.figure.create({ _preserve: { class: "icon" } }, [
									schema.nodes.image.create({
										src: PYTHR_STYLES.development.icon,
										_preserve: { class: "round" },
									}),
								]),
								schema.nodes.article.create(null, [
									schema.nodes.heading.create(
										{ level: 4 },
										schema.text("Development"),
									)
								]),
								schema.nodes.paragraph.create(
									null,
									schema.text("This is a development and/or event block, for some kind of event that should be tracked."),
								),
							]
						);
						menu.view.dispatch(menu.view.state.tr.replaceSelectionWith(divNode));
						return true;
					}
				},
				{
					action: "pjp_treasure",
					title: "Treasure ☍",
					node: menu.schema.nodes.div,
					cmd: () => {
						const { schema } = menu;
						const divNode = schema.nodes.div.create(
							{ _preserve: { class: "fvtt quest", "data-button-id": Math.random().toString(36).slice(2), "data-button-type": "treasure" } },
							[
								schema.nodes.figure.create({ _preserve: { class: "icon" } }, [
									schema.nodes.image.create({
										src: PYTHR_STYLES.treasure.icon,
										_preserve: { class: "round" },
									}),
								]),
								schema.nodes.article.create(null, [
									schema.nodes.heading.create(
										{ level: 4 },
										schema.text("Treasure"),
									)
								]),
								schema.nodes.paragraph.create(
									null,
									schema.text("This is a treasure block."),
								),
							]
						);
						menu.view.dispatch(menu.view.state.tr.replaceSelectionWith(divNode));
						return true;
					}
				},
				{
					action: "pjp_advice",
					title: "Advice",
					node: menu.schema.nodes.div,
					cmd: () => {
						const { schema } = menu;
						const divNode = schema.nodes.div.create(
							{ _preserve: { class: "fvtt advice" } },
							[
								schema.nodes.figure.create({ _preserve: { class: "icon" } }, [
									schema.nodes.image.create({
										src: PYTHR_STYLES.advice.icon,
										_preserve: { class: "round" },
									}),
								]),
								schema.nodes.article.create(null, [
									schema.nodes.heading.create(
										{ level: 4 },
										schema.text("Advice Block"),
									)
								]),
								schema.nodes.paragraph.create(
									null,
									schema.text("This is an advice block."),
								),
							]
						);
						menu.view.dispatch(menu.view.state.tr.replaceSelectionWith(divNode));
						return true;
					}
				},
				{
					action: "pjp_milestone",
					title: "Milestone ☍",
					node: menu.schema.nodes.div,
					cmd: () => {
						const { schema } = menu;
						const divNode = schema.nodes.div.create(
							{ _preserve: { class: "fvtt quest", "data-button-id": Math.random().toString(36).slice(2), "data-button-type": "milestone" } },
							[
								schema.nodes.figure.create({ _preserve: { class: "icon" } }, [
									schema.nodes.image.create({
										src: PYTHR_STYLES.milestone.icon,
										_preserve: { class: "round" },
									}),
								]),
								schema.nodes.article.create(null, [
									schema.nodes.heading.create(
										{ level: 4 },
										schema.text("Milestone"),
									)
								]),
								schema.nodes.paragraph.create(
									null,
									schema.text("This is an milestone block, potentially awarding [[/award 0xp each]]."),
								),
							]
						);
						menu.view.dispatch(menu.view.state.tr.replaceSelectionWith(divNode));
						return true;
					}
				},
            ]
        });
    }
});
Hooks.on("renderJournalEntryPageProseMirrorSheet", onRenderJournalEntryPageProseMirrorSheet);

function onRenderJournalEntryPageProseMirrorSheet(app, html, context, options) {
	const parentSheet = app.document.parent?.sheet;

	if ( foundry.utils.isSubclass(parentSheet.constructor, PythrJournal) && app.isEditable ) {
		cssclasses.forEach((n) => app.element.classList.add(n));
	
		// ------------------------------------------------  //
		/*                Event Completion Flag              */
		/*                                                   */
		/* "0" => Not Started, 							     */
		/* "1" => Active Event,								 */
		/* "2" => Event Concluded,                           */
		/* "3" => Undecided Event (Cannot be manually set)   */
		/* "4" => Not an Event                               */
		/* "5" => Event Failed and/or Missed                 */
		// ------------------------------------------------- //
		const doc = app.document; 
		const completedKeyFlagValue = doc.getFlag(MODULE_ID, completed_key) ?? "3";
		const name = `flags.${MODULE_ID}.${completed_key}`;
		
		// Creating the Selection List for Event Status
		const input = foundry.applications.fields.createSelectInput({ name, value: completedKeyFlagValue, options: completed_options })
		const group = foundry.applications.fields.createFormGroup({
			input,
			label: "",
			localize: false
		});
		group.classList.add("flexrow");
		group.children[0].classList.add("flex0");
		group.children[0].classList.add("fa-solid");
		group.children[0].classList.add("fa-bookmark");
		group.children[0].setAttribute('data-tooltip', "");
		group.children[0].setAttribute('aria-label', 'Event Status');
		
		// Attaching the List to the Editor
		const editTab = html.querySelector(`.page-metadata`);
		if(editTab) {
			input.removeChild(input.options[0]);
			group.classList.add("event-progress-editor");
			editTab.append(group);
		} else {
			group.classList.add("event-progress-page");
		}
		
		// Attaching the List to the Journal Page
		const advanceButton = html.querySelector(`.journal-page-content`);
		const isEvent = !(completedKeyFlagValue == '' || completedKeyFlagValue == "3");

		if(isEvent && !editTab && advanceButton && completedKeyFlagValue !== "4") {
			input.removeChild(input.options[1]);
			input.removeChild(input.options[0]);
			
			const buttonContainer = document.createElement("div");
			buttonContainer.classList.add('flags-button-container');
			const eventButton = document.createElement("button");
			const buttonText = document.createElement("p");
			eventButton.appendChild(buttonText);
			eventButton.classList.add("event-create-button");
			eventButton.classList.add("fa-solid");
			eventButton.setAttribute('data-tooltip', '');
			
			const resetButton = eventButton.cloneNode(true);
			resetButton.classList.add("fa-arrow-rotate-left");
			resetButton.setAttribute('aria-label', 'Set Event to Not Started');
			const resetText = document.createElement("p");
			resetText.innerText = "Reset Event";
			resetButton.appendChild(resetText);
				
			const failButton = eventButton.cloneNode(true);
			failButton.classList.add("fa-xmark");
			failButton.setAttribute('aria-label', 'Set Event to Failed');
				
			resetButton.addEventListener('click', () => {
				doc.setFlag(MODULE_ID, completed_key, "0");
			})
				
			failButton.addEventListener('click', () => {
				doc.setFlag(MODULE_ID, completed_key, "5");
			})
			
			if(completedKeyFlagValue == "0") {
				// If the event has not started, add a 
				// Begin Event button to top of Journal Entry Page.
				eventButton.classList.add("fa-forward");
				eventButton.setAttribute('aria-label', 'Set Event to Active');
				buttonText.innerText = "Begin Event";
				eventButton.addEventListener('click', () => {
					doc.setFlag(MODULE_ID, completed_key, "1");
				})
				
				failButton.innerHTML = `<p>Event Failed/Missed</p>`;
				
				buttonContainer.append(failButton);
				buttonContainer.append(eventButton);
				
				advanceButton.append(buttonContainer);
				advanceButton.prepend(group);
				
			} else if(completedKeyFlagValue == "1") {
				// If the event has begun but has not concluded, add a reset event
				// and complete event button to the bottom of the Journal Entry Page.
				eventButton.classList.add("fa-check");
				eventButton.setAttribute('aria-label', 'Set Event to Completed');
				buttonText.innerText = "Event Completed";
				eventButton.addEventListener('click', () => {
					doc.setFlag(MODULE_ID, completed_key, "2");
				})
				
				failButton.innerHTML = `<p>Event Failed</p>`;
				
				buttonContainer.prepend(resetButton);
				buttonContainer.prepend(failButton);
				buttonContainer.appendChild(eventButton);
				
				advanceButton.prepend(group);
				advanceButton.append(buttonContainer);
				
			} else {
				// If the event has concluded, then add a reset button.
				buttonContainer.append(resetButton);
				
				advanceButton.prepend(group);
				advanceButton.append(buttonContainer);
			}
			
			// Add the event listener for any of the dropdowns added to the journal.
			const lists = html.querySelectorAll(`select[name="${name}"]`);
			for( const list of lists ) {
				list.addEventListener("change", () => {
					doc.setFlag(MODULE_ID, completed_key, list.options[list.selectedIndex].value);
				})
			}
		}
		
		
		
		// Add a button for quick Event Creation
		if(!isEvent && (editTab == null) && advanceButton) {
			
			const createButton = document.createElement("button");
			const buttonText = document.createElement("p");
			const removeText = document.createElement("p");
			createButton.classList.add("event-create-button");
			createButton.classList.add("fa-solid");
			createButton.setAttribute('data-tooltip', '');
			createButton.setAttribute('aria-label', 'Change current Journal Page into an Event');
			buttonText.innerText = "Make Event";
			removeText.innerText = "Not an Event";
			const removeButton = createButton.cloneNode(true);
			removeButton.setAttribute('aria-label', 'Remove event buttons from Journal Page.');
			createButton.classList.add("fa-bookmark");
			removeButton.classList.add("fa-x");
			createButton.appendChild(buttonText);
			removeButton.appendChild(removeText);
			
			const buttonContainer = document.createElement("div");
			buttonContainer.classList.add("flags-button-container");
			
			createButton.addEventListener("click", () => {
				doc.setFlag(MODULE_ID, completed_key, "0");
			})
			removeButton.addEventListener("click", () => {
				doc.setFlag(MODULE_ID, completed_key, "4");
			})
			buttonContainer.appendChild(createButton);
			buttonContainer.appendChild(removeButton);
			advanceButton.append(buttonContainer);
		}
		
		
		
		// Adding functionality for Encounter & Treasure buttons by appending it to the end of the container.
		// I can't recall why I originally did this in a fashion that cloned the item and replaced the original with the new version.
		const content = html.querySelector(`.journal-page-content`).querySelectorAll(`[data-button-id]`);
		for(let em of content) {
			if(em.dataset?.uuid?.toLowerCase().includes("compendium")) continue;
			
			if(game.user.isGM && em.dataset.buttonId) {
				addButtonStatusEmbed(em, app);
			} else {
				console.warn(`Embed enricher somehow got an embed that isn't accepted.`);
				console.warn(em);
			}
		}
		
		// Inject the JournalEntryPage Embed status after the previous routine, to prevent overwriting it.
		const embedStatusTargets = html.querySelector(`.journal-page-content`).querySelectorAll(`a[data-type="JournalEntryPage"], a[data-type="Scene"]${theatre_inserts_active ? ", a[data-type=\"Actor\"]" : ""}`);
		for(let em of embedStatusTargets) {
			if(em.dataset?.uuid?.toLowerCase().includes("compendium")) continue;
			const first_child = em.children[0];
			
			if(em.dataset?.type == "Scene" && game.user.isGM) {
				addSceneViewButtonEmbed(em, app);
			} else if(em.dataset?.type == "Actor" && game.user.isGM) {
				if(["loot actor", "hazard actor", "vehicle actor", "army actor", "party actor"].includes(em.ariaLabel?.toLowerCase())) continue;
				if(theatre_inserts_active) addTheatreButtonEmbed(em, app);
			} else if(em.dataset?.type == "JournalEntryPage") {
				if(foundry.utils.isSubclass(pageFromUuid(em.dataset.uuid).parent?.sheet.constructor, PythrLocationJournal)) {
					first_child.classList.remove('fa-file-lines');
					first_child.classList.add('fa-map-location-dot');
					em.dataset.tooltipText = 'Location Page';
				}
				addJournalEventStatusEmbed(em, app, first_child);
			} else {
				console.warn(`Embed enricher somehow got an embed that isn't accepted.`);
				console.warn(em);
			}
		}
		
		// Add new context menu for Embedded events.
		const EVENT_EMBED_MENU_ITEMS = [
			EventContextObject("", "fa-play", ["0"], "1", app), // Begin Event
			EventContextObject("", "fa-check", ["1", "5"], "2", app), // Mark Event as Complete
			EventContextObject("", "fa-xmark", ["1", "2"], "5", app), // Mark Event as Failed
			EventContextObject("", "fa-arrow-rotate-left", ["1", "2", "5"], "0", app), // Reset Event
			EventContextObject("", "fa-rotate", ["3", "4"], "0", app), // Convert to Event
			EventContextObject("", "fa-eraser", ["0", "1", "2", "5"], "4", app), // Remove Event Status
		]
		
		new foundry.applications.ux.ContextMenu.implementation(html, "a.pjp-event-embed", EVENT_EMBED_MENU_ITEMS, {jQuery: true});
		
		// Fix positioning 
		app.setPosition();
	}
}

const status_to_css = {
	0: "pjp-event-embed-notstarted",
	1: "pjp-event-embed-started",
	2: "pjp-event-embed-complete",
	5: "pjp-event-embed-failed"
}

Hooks.on("renderPythrJournal", (app, html, context, options) => {
	// --------------------- //
	/*  Event Status on TOC  */
	// --------------------- //	
	var collection = {}
	for( const content of context.toc ) {
		if( content.isCategory ) {
			collection[content.id] = []
			continue;
		}
		
		const sheet = app.getPageSheet(content.id)
		const eventStatus = sheet.document.getFlag(MODULE_ID, completed_key);
		const heading = html.querySelector(`[data-page-id="${content.id}"]`);
		if( content.category ) collection[content.category].push(heading)
		
		// Create a small indiciator next to TOC items correlating with Event Status
		if(["0", "1", "2", "5"].includes(eventStatus)) {
			const title = heading.querySelector(`.page-title`);
			title.classList.add(status_to_css[eventStatus]);
			switch(game.settings.get(MODULE_ID, "tocEventStyle")) {
				case 1:
					heading.style.borderRight = `0.2rem solid ${status_colours[eventStatus]}`;
					heading.style.borderTopRightRadius = "5px";
					heading.style.borderBottomRightRadius = "5px";
					break;
				case 2:
					heading.style.backgroundColor = `${status_colours[eventStatus]}20`
					break;
				default:
					break;
			}
		}
	}
	
	// Wrap each category section in a div.
	for( var key in collection ) {
		if( !collection[key].length || !app.isEditable ) continue
		
		const heading = html.querySelector(`[data-category-id="${key}"]`);
		
		const wrapper = document.createElement('div')
		wrapper.classList.add('collapseTOC')
		
		const active = app.document.getFlag(MODULE_ID, collapse_key)?.[key] ?? true
		if( active ) {
			wrapper.classList.add('active')
			wrapper.style.overflow = 'visible'
		} else {
			heading.classList.add('colactive')
		}
		
		wrapper.dataset.categoryId = key
		
		const innerWrapper = document.createElement('div')
		wrapper.appendChild(innerWrapper)
		
		const firstElement = collection[key][0]
		firstElement.parentNode.insertBefore(wrapper, firstElement)
		
		for( const em of collection[key] ) {
			innerWrapper.appendChild(em)
		}
		
		heading.addEventListener('click', () => {
			const id = heading.dataset.categoryId
			heading.classList.toggle('colactive');
			var content = heading.nextElementSibling
			var keys = app.document.getFlag(MODULE_ID, collapse_key) ?? {[id]: true}
			if( heading.classList.contains('colactive') ) {
				keys[id] = false
				content.classList.remove('active')
				content.style.overflow = 'hidden'
			} else {
				keys[id] = true
				content.classList.add('active')
				setTimeout(() => { content.style.overflow = heading.classList.contains('colactive') ? 'hidden' : 'visible' }, 500);
			}
			
			if( app.isEditable ) app.document.update({flags: {[MODULE_ID]: {[collapse_key]: keys}}}, {render: false})
		})
		
	}
	
	// app.setPosition();
});

Hooks.on("renderJournalEntryCategoryConfig", (app, html, context) => {
	if(foundry.utils.isSubclass(app.document.sheet?.constructor, PythrLocationJournal)) {
		const options = html.querySelector("ol.plain");
		
		const newField = document.createElement('input');
		newField.style.width = "2.5rem";
		newField.style.textAlign = "center";
		newField.type = "text";
		
		for(const category of options.children) {
			const name = category.querySelector(`[type="text"]`);
			if(name.value.toLowerCase().includes('overview')) continue;
			
			const locationField = newField.cloneNode(true);
			locationField.placeholder = name.value.charAt(0);
			locationField.value = app.document.getFlag(MODULE_ID, location_letter_key)?.[category.dataset.categoryId] ?? ""
			
			locationField.addEventListener('change', () => {
				let cur_map = app.document.getFlag(MODULE_ID, location_letter_key) ?? {};
				cur_map[category.dataset.categoryId] = locationField.value;
				app.document.setFlag(MODULE_ID, location_letter_key, cur_map);
			})
			
			name.after(locationField);
		}
	}
})

Hooks.on("getJournalEntryPageContextOptions", (app, menu) => {
	const start_context = EventContextObject("Begin Event", "fa-play", ["0"], "1", app);
	const complete_event = EventContextObject("Mark Event as Complete", "fa-check", ["1", "5"], "2", app);
	const fail_event = EventContextObject("Mark Event as Failed", "fa-xmark", ["1", "2"], "5", app);
	const reset_context = EventContextObject("Reset Event", "fa-arrow-rotate-left", ["1", "2", "5"], "0", app);
	const convert_event = EventContextObject("Convert to Event", "fa-rotate", ["3", "4"], "0", app);
	const delete_event = EventContextObject("Remove Event Status", "fa-eraser", ["0", "1", "2", "5"], "4", app);
	
	// Add context menu buttons to spots after Edit
	/*menu.splice(1, 0, reset_context);
	menu.splice(1, 0, fail_event);
	menu.splice(1, 0, complete_event);
	menu.splice(1, 0, start_context);*/
	
	// Push context menu buttons to bottom of menu
	
	if ( foundry.utils.isSubclass(app.constructor, PythrJournal) && app.isEditable ) {
		menu.push(start_context);
		menu.push(complete_event);
		menu.push(fail_event);
		menu.push(reset_context);
		menu.push(convert_event);
		menu.push(delete_event);
	}
});

function EventContextObject(name, icon, start_key, target_key, app) {
	const obj = {
		label: name,
		icon: `<i class=\"fa-solid ${icon}\"></i>`,
		visible: (li) => {
			let page;
			if(li[0]?.dataset?.uuid) page = pageFromUuid(li[0].dataset.uuid);
			else page = app?.getPageSheet(li.dataset.pageId).document;
			if(app.isEditable && start_key.includes(page.getFlag(MODULE_ID, completed_key) ?? "4")) return true
			else return false
		},
		callback: (li) => {
			let page;
			if(li[0]?.dataset?.uuid) {
				li[0].classList.add(status_to_css[target_key]);
				page = pageFromUuid(li[0].dataset.uuid);
				li[0].classList.remove(status_to_css[page.getFlag(MODULE_ID, completed_key)]);
			}
			else page = app?.getPageSheet(li.dataset.pageId).document;
			page.setFlag(MODULE_ID, completed_key, target_key)
			app.setPosition();
		}
	}
	
	return obj;
}

function pageFromUuid(uuid) {
	const journalId = uuid.split('JournalEntry.').pop().split('.JournalEntry')[0];
	const pageId = uuid.split('JournalEntryPage.').pop();
	return game.journal?.get(journalId).pages?.get(pageId);
}

class PythrJournal extends foundry.applications.sheets.journal.JournalEntrySheet {
	static DEFAULT_OPTIONS = {
		classes: ["pythr", "themed", "theme-dark", "dnd5e2", "dnd5e2-journal", "titlebar"],
		position: {
			width: 1080,
			height: 820
		}
	}
	
	async _prepareSidebarContext(context, options) {
		await super._prepareSidebarContext(context, options);
		this.reorderPages(context.toc);
	}
	
	reorderPages(toc) {
		const overviewId = [], appendixId = [];
		for ( const page of toc ) {
			if ( page.isCategory ) {
				if ( page.name.toLowerCase().includes("overview") ) {
					overviewId.push(page.id);
			} else if ( page.name.toLowerCase().includes("appendix") || page.name.toLowerCase().includes("context") || page.name.toLowerCase().includes("additional") ) {
					appendixId.push(page.id);
				} continue;
			}
		} assignPages(toc, overviewId, appendixId);
    }
}

class PythrLocationJournal extends PythrJournal {
	
	async _prepareSidebarContext(context, options) {
		await super._prepareSidebarContext(context, options);
		this.reorderPagesLoc(context.toc);
	}
	
	reorderPagesLoc(toc) {
		const overviewId = [], appendixId = [];
		for ( const page of toc ) {
			if ( page.isCategory ) {
				if ( page.name.toLowerCase().includes("overview") ) {
					overviewId.push(page.id);
			} else if ( page.name.toLowerCase().includes("appendix") || page.name.toLowerCase().includes("context") || page.name.toLowerCase().includes("additional") ) {
					appendixId.push(page.id);
				} continue;
			}
		} assignPages(toc, overviewId, appendixId, true, (this.document.getFlag(MODULE_ID, location_letter_key) ?? null));
	}
}

class PythrSheet extends JournalEntryPageProseMirrorSheet {	
	static DEFAULT_OPTIONS = {
		form: {
			submitOnChange: true
		}
	};
}

const paragraphSymbol = String.fromCharCode(182);
const appendixSymbol = String.fromCharCode(576);

function assignPages(toc, overviewId, appendixId, loc = false, loc_key = null) {
	let i = 1;
	let overviewChar = 0;
	let currentOverview = ""
	let locationChar = ""
	let it = 0;	
	
	for ( const page of toc ) {
		
		if (page.isCategory) {
			if(loc && !overviewId.some((p) => p == page.id) && !appendixId.some((p) => p == page.id)) {
				if(currentOverview !== page.id) currentOverview = page.id;
				if(locationChar !== loc_key?.[currentOverview]) i = 1;
				if(loc_key !== null && loc_key[currentOverview]) locationChar = loc_key[currentOverview]
				else locationChar = page.name.charAt(0);
				// page.name = page.name.substring(1, page.name.length);
			} continue;
		}
		
		const indented = ["level2", "level3"].some(e => {return page.tocClass.includes(e)});
		
		if ( overviewId.includes(page.category) && !indented ) {
			/*if (page.category !== currentOverview) {
				overviewChar = 0;
				currentOverview = page.category;
			}*/
			
			if(overviewId.length > 1) {
				if (page.category !== currentOverview) {
					if(currentOverview !== overviewId[0]) overviewChar++;
					it = 1;
				} page.number = String.fromCharCode(overviewChar + 65) + String(it++);
			} else page.number = String.fromCharCode(overviewChar++ + 65);
			continue;
		} else if ( appendixId.includes(page.category) && !indented ) {
			page.number = appendixSymbol;
			continue;
		}
		
		if(loc) {
			if ( page._index ) page.number = page._index;
			else if ( !indented ) page.number = locationChar + i++;
		} else {
			if ( page._index ) page.number = page._index;
			else if ( !indented ) page.number = i++;
		}
		
		if ( indented ) {
			page.number = `├`;
		}
	}
}

function addJournalEventStatusEmbed (em, app, first_child) {
	let page;
	try {
		page = fromUuidSync(em.dataset.uuid);
	} catch {
		console.warn(`pythr Journal Project | Journal Entry could not be loaded from UUID.`);
		console.warn(em);
	}
	const event_status = page.getFlag(MODULE_ID, completed_key);
	if(["0", "1", "2", "5"].includes(event_status)) {
		if(first_child.classList.contains('fa-solid')) {
			first_child.classList.remove('fa-file-lines');
			first_child.classList.add('fa-square-poll-horizontal');
		}
		
		em.classList.add('pjp-event-embed');
		
		switch (event_status) {
			case "0":
				em.classList.add('pjp-event-embed-notstarted');
				em.dataset.tooltipText = "Event: Not Started";
				break;
			case "1":
				em.classList.add('pjp-event-embed-started');
				em.dataset.tooltipText = "Event: Started";
				break;
			case "2":
				em.classList.add('pjp-event-embed-complete');
				em.dataset.tooltipText = "Event: Complete";
				break;
			case "5":
				em.classList.add('pjp-event-embed-failed');
				em.dataset.tooltipText = "Event: Incomplete/Failed";
				break;
		}
	}
}

function addSceneViewButtonEmbed (em, app) {
	let scene;
	try {
		scene = fromUuidSync(em.dataset.uuid);
	} catch {
		console.warn(`pythr Journal Project | Scene could not be loaded from UUID.`);
		console.warn(em);
	}
	const viewSceneWrapper = document.createElement("span");
	viewSceneWrapper.classList.add("reference-link");
	viewSceneWrapper.append(em.cloneNode(true));
				
	const viewSceneButton = document.createElement("a");
	viewSceneButton.classList.add("enricher-action");
	viewSceneButton.setAttribute('data-tooltip', '');
	viewSceneButton.setAttribute('aria-label', 'Change Current View to Scene');
	viewSceneButton.innerHTML = `<i class="fa-solid fa-magnifying-glass"></i>`;
	viewSceneWrapper.append(viewSceneButton);
				
	viewSceneButton.addEventListener('click', () => {
		scene.view();
	})
				
	em.replaceWith(viewSceneWrapper);
}

function addTheatreButtonEmbed (em, app) {
	let actor_to_add;
	try {
		actor_to_add = fromUuidSync(em.dataset.uuid);
	} catch {
		console.warn(`pythr Journal Project | Actor could not be loaded from UUID.`);
		console.warn(em);
		return;
	}
		let is_actor_staged = Theatre.isActorStaged(actor_to_add);
		const addToTheatreWrapper = document.createElement("span");
		addToTheatreWrapper.classList.add("reference-link");
		addToTheatreWrapper.append(em.cloneNode(true));
				
		const addToTheatreButton = document.createElement("a");
		addToTheatreButton.classList.add("enricher-action");
		addToTheatreButton.setAttribute('data-tooltip', '');
		addToTheatreButton.setAttribute('aria-label', 'Add Actor to Theater Bar');
		addToTheatreButton.innerHTML = `<i class="fa-regular ${is_actor_staged ? "fa-user-minus" : "fa-masks-theater"}"></i>`;
		addToTheatreWrapper.append(addToTheatreButton);
				
		addToTheatreButton.addEventListener('click', () => {
			if(is_actor_staged) {
				Theatre.removeFromNavBar(actor_to_add);
			} else {
				Theatre.addToNavBar(actor_to_add);
			} is_actor_staged = !is_actor_staged;
			app.render();
		})
					
	em.replaceWith(addToTheatreWrapper);
}

function addButtonStatusEmbed (em, app) {
	const doc = app.document;
	const button_flags_map = doc.getFlag(MODULE_ID, button_flags_key) ?? {};
	const button_key = em.dataset.buttonId;
	// const is_treasure = em.dataset.buttonType == "treasure";
	let current_flag = button_flags_map?.[button_key] ?? false;
	// const treasureSection = em.cloneNode(true);
	
	const title = em.querySelector("article :is(h3, h4)") ?? null;
	const check = document.createElement('a');
	if(title) title.append(check);
	check.classList.add('fa-regular');
	check.style.marginLeft = '0.4rem';
	
	if(current_flag) {
		const img = em.querySelector("figure.icon").querySelector("img");
		img.style.filter = "grayscale(1)";
		
		const list = em.querySelector("aside.encounter")?.querySelector("ol") ?? null;
		if(list) list.style.textDecoration = "line-through";
		check.classList.add('fa-square-check');
		
		/*for(let line_through of [title, list]) {
			if(line_through) line_through.style.textDecoration = "line-through";
		}*/
	} else {
		check.classList.add('fa-square');
	}
	
	check.addEventListener('click', () => {
		let cur_map = doc.getFlag(MODULE_ID, button_flags_key) ?? {};
		cur_map[button_key] = !cur_map[button_key] ?? true;
		current_flag = cur_map[button_key];
		doc.setFlag(MODULE_ID, button_flags_key, cur_map);
	});	
	
	/*const treasureButtonWrapper = document.createElement('div');
	treasureButtonWrapper.classList.add('pjp-section-button-container');
					
	const treasureButtonText = document.createElement('span');
	treasureButtonText.innerHTML = `<p>${is_treasure ? "Claimed" : "Completed"}</p>`
					
	const treasureButtonInput = document.createElement('input');
	treasureButtonInput.type = `checkbox`;
	treasureButtonInput.checked = current_flag;*/			
	
	/*treasureButtonInput.addEventListener('click', () => {
		let cur_map = doc.getFlag(MODULE_ID, button_flags_key) ?? {};
		cur_map[button_key] = !cur_map[button_key] ?? true;
		current_flag = cur_map[button_key];
		doc.setFlag(MODULE_ID, button_flags_key, cur_map);
	});*/
					
	//treasureButtonWrapper.append(treasureButtonText);
	//treasureButtonWrapper.append(treasureButtonInput);
					
	// em.append(treasureButtonWrapper);
	// em.replaceWith(treasureSection);
}