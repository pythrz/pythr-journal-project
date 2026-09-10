# Pythr's Journal Project
A personal project to create a Foundry VTT journal that strives to add tools that allow for an enhanced journal entry creation process and note-taking aids that allow you to track your party's progress with a few simple clicks.

Creating this module happened when I wanted specific features in an easy-to-use package that kept much of my prep on a single window. Much of it is my first attempt at making something functional and a lot of its current functions came from my own needs in my campaigns and workflow, which mean they function in the way that works for me. Which is to say, they likely aren't implemented as well as I'd like, and I wish to improve it as much as I can with feedback. That being said, I hope you find some use in my little pet project!

Current features include:
- A reskinned AppV2 journal with support for both standard and event location journals,
- Event status tracking attached to journal entry pages,
- Easily insertable text sections to aid in creating easier to parse journal pages, for sections such as encounters, treasure, and developments,
- Enhanced embed functionality for journal page documents with event statuses and scenes.

## Using the Journal Entries
When you first load the module, your journals will have no changes. To ensure you have full control over the styling of your individual journals, the module doesn't replace the existing styling for the base system journal.

To change your journal into the newly added journal sheet, follow these instructions:
1. Open the Journal Entry you wish to change the sheet of;
2. Locate the vertical ellipsis on the top right of the journal window, click on it to expand the options;
3. Click on the "Configure Sheet" option, which should bring up a menu;
4. Under the "Document" section, locate the entry labeled "This Sheet";
5. Use the dropdown menu to select either **Pythr Journal Entry** or **Pythr Location Entry**.
6. (Optional) If you wish to change all of your journals that lack a manual sheet override, locate the "Defaults" section just underneath; under "Default Sheet," use the dropdown to select either **Pythr Journal Entry** or **Pythr Location Entry**.
<img width="333" height="247" alt="Change Journal Sheet" src="https://github.com/user-attachments/assets/8c32e14b-e13d-4e2a-b554-1abc7d166b27" />

### Journal Page Indexing
Each journal sheet treats the indexing of its pages differently. This is purely a visual change, so you can safely ignore this if the specifics don't affect you.
- For the standard **Pythr Journal Entry**:
  - Indexing persists through categories, without resetting its count once it reaches a new category. Pages labeled 1 through 5 in one category will be followed by page 6 in a new category, from top to bottom.
  - Any pages assigned to a category with the word "Overview" will use capital letters in place of numbers for their displayed index.
  - Any pages assigned to a category with the word "Appendix" will use the "ɀ" symbol as their index, in place of any incremental option.
- For the **Pythr Location Entry**:
  - Overview and Appendix categories function the same as above.
  - Any other category will have a new field within the category editor, which allows for a prefix to added for the purpose of indexing.
  - Each page will increment the index by 1, while adding its category's prefix to its index. A category with a different prefix will reset the count to 1.
  - To keep the number increasing between categories, assign each category with the same prefix.
## Per-Page Event Status Tracking
Often times, journal entries are written as standalone events and/or have some type of progress associated with them. While using either journal sheet, each page can be given an **event status** that allows you to easily track what your players haven't done, are currently in the process of doing, or have already completed. It's been set up in a way to be as unobtrusive as possible while still providing easy access for real-time editing of these statuses without requiring you to open up the journal page editor in the middle of a session.

There are three methods of adding an event status to a journal's page:
1. Any journal pages created before the addition of the module will have buttons available at the bottom of their page, to allow for easy conversion of pre-existing journals.
2. When editing a journal page, a dropdown within the editor's header will be available to set an event's current status (including removing it entirely).
3. Right-clicking on a journal page within the table of contents inside a journal will show an option to allow for quick assignment of an event status.

Event statuses can be managed either through the editor's dropdown, the buttons and/or dropdown provided while the page is open, or by right-clicking either the journal page within the table of contents or an embed that links to the journal page.

The event status will be displayed on the journal's table of contents with a small badge. Any embeds that link to that journal page will also display the journal's event status. Similar to the event status tracking, these are made to be as simple to toggle as possible, to allow for easy tracking in the middle of a session.

## Insertable Event Blocks
Sometimes, you need something to visually break away from any dense text that may be featured in your journals. You can easily insert one of these text blocks by following these steps:
1. Open the editor for the journal entry page;
2. On the leftside of the editor format bar, click on the dropdown that says "Format";
3. Navigate to the section that's called "Pythr Journals" and hover over it;
4. Select the text block that best matches your use case.

<img height="247" alt="Add Text Block" src="https://github.com/user-attachments/assets/1d2c4da4-f845-4b4f-9482-8cee0f93ebca" />

Some of the options are appended by a "**☍**" icon. When you need to track multiple states on a single journal page, such as multiple encounters, these options will come with a button next to the block's title that allows for a binary incomplete / completed state.

<img height="247" alt="Toggle Block State" src="https://github.com/user-attachments/assets/1d06489e-e6da-40a5-89dd-1614a115a070" />


## Enhanced Embed Functionality
A few functionalities have been added whenever you embed a document (such as a journal entry page or scene) onto a journal entry page. These additional functions only work for GM users.
- As stated before, linking to any journal entry page that has a **event status** on it will display with an inline badge. You can quickly adjust an event's status by right-clicking on this embed.
- When linking a scene onto a page, a small magnifying glass will appear next to it. Clicking on the magnifying glass will change the user's view to that linked scene.
- If the [Theatre Inserts](https://github.com/League-of-Foundry-Developers/fvtt-module-theatre) module is installed and enabled, embedded actors on journal entry pages will have a small theatre mask next to their name, allowing for easy additions to the stage.
