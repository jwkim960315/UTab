let data;

// chrome.storage.sync.clear();

// Initialization
$(document).ready(() => {
    chrome.storage.sync.get(null,res => {

        data = res;

        urlFormIds = urlIdsToLst(data);

        groupIds = Object.keys(data);

        console.log(data);

        // rendering all the storage data
        Object.keys(data).forEach((groupKey,index) => {
            $('.group-cont').append(`
                <div class="card" id="${groupKey}">
                    <div class="card-content">
                        <div class="row">
                            <div class="col s12 m11">
                                <span id="${groupKey}" class="card-title">${data[groupKey].groupName}</span>
                            </div>
                            <div class="col s12 m1">
                                <button class='dropdown-trigger btn' data-target='group-settings${groupKey.slice(-1)}'><i class="material-icons">settings</i></button>
                                <ul id='group-settings${groupKey.slice(-1)}' class='dropdown-content'>
                                    <li><a class="change-color ${groupKey}">change color</a></li>
                                    <li class="divider" tabindex="-1"></li>
                                    <li><a class="edit-group-name">edit group name</a></li>
                                    <li class="divider" tabindex="-1"></li>
                                    <li><a class="delete-group red-text">delete group</a></li>
                                </ul>
                            </div>
                        </div>
                        <div class="url-cont" id="url-cont-${groupKey}">
                            ${renderLinks(data,parseInt(groupKey.slice(-1)),urlFormIds)}
                        </div>
                        <div class="row new-url-data">
                            <div class="col">
                                <a class="waves-effect waves-light btn add-link"><i class="material-icons">add</i>New Link</a>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="color-picker-placeholder"></div>
            `);
            const rgbColor = tinycolor(data[groupKey].color);
            $(`div[id="${groupKey}"]`).css('color',`${rgbColor.toRgbString()}`);
            $(`div[id="${groupKey}"]`).find('.url-text').css('color',`${rgbColor.toRgbString()}`);
            const rgbRightShadow = rgbColor.setAlpha(.14).toRgbString();
            const rgbTopShadow = rgbColor.setAlpha(.12).toRgbString();
            const rgbLeftShadow = rgbColor.setAlpha(.2).toRgbString();
            const boxShadow = `0 2px 2px 0 ${rgbRightShadow}, 0 3px 1px -2px ${rgbTopShadow}, 0 1px 5px 0 ${rgbLeftShadow}`;
            $(`div[id="${groupKey}"]`).css('box-shadow',`${boxShadow}`);


        });



        // initialize group settings dropdown
        $('.dropdown-trigger').dropdown();

        // initialize sortable drag & drop
        $('.url-cont').sortable({
            // SortableJS options go here
            // See: (https://github.com/SortableJS/Sortable#options)
            group: 'shared',
            animation: 150,
            draggable: '.url-buttons',
            onEnd: event => {

                // console.log($(event.item));
                const oldGroupId = $(event.from).prop('id').slice(9);
                const newGroupId = $(event.to).prop('id').slice(9);
                const { oldDraggableIndex, newDraggableIndex } = event;
                const draggedUrlData = data[oldGroupId].data[oldDraggableIndex];

                if (oldGroupId === newGroupId) {
                    data[oldGroupId].data[oldDraggableIndex] = data[oldGroupId].data[newDraggableIndex];
                    data[oldGroupId].data[newDraggableIndex] = draggedUrlData;
                } else {
                    data[oldGroupId].data.splice(oldDraggableIndex,1);
                    data[newGroupId].data.splice(newDraggableIndex,1,draggedUrlData);
                }



                chrome.storage.sync.set({[oldGroupId]: data[oldGroupId]},() => {
                    console.log('Old group has been updated!');
                    chrome.storage.sync.set({[newGroupId]: data[newGroupId]}, () => {
                        console.log('New group has been updated!');
                    });
                });

                /*
                evt.item;  // dragged HTMLElement
                evt.to;    // target list
                evt.from;  // previous list
                evt.oldIndex;  // element's old index within old parent
                evt.newIndex;  // element's new index within new parent
                evt.oldDraggableIndex; // element's old index within old parent, only counting draggable elements
                evt.newDraggableIndex; // element's new index within new parent, only counting draggable elements
                evt.clone // the clone element
                evt.pullMode;  // when item is in another sortable: `"clone"` if cloning, `true` if moving
                */
            },
        });
    });
});

// Add new group
$('.add-group').click(() => {

    let groupNum = idGenerator(groupIds);

    const groupName = `Group${groupNum}`;

    const newGroupData = {
        groupName,
        data: []
    };

    $('.group-cont').append(`
        <div class="card">
            <div class="card-content">
                <div class="row">
                    <form class="add-group-form">
                        <div class="input-field col s10 l8">
                            <label for="group${groupNum}">Group Name</label>
                            <input id="group${groupNum}" type="text" class="validate">
                        </div>
                        <div class="col s1 l1">
                            <button class="waves-effect waves-light btn right" type="submit"><i class="material-icons">save</i></button>
                        </div>
                    </form>
                </div>
                <div class="row">
                    <a class="waves-effect waves-light btn add-link"><i class="material-icons">add</i>New Link</a>
                </div>
            </div>
        </div>
    `);

    chrome.storage.sync.set({
        [`group${groupNum}`]: newGroupData
    });

    data[`group${groupNum}`] = newGroupData;
});

// onSubmit add-group-form
$(document).on('submit','.add-group-form',function(e) {
    e.preventDefault();

    const inputElem = $(this).find('input');
    const inputVal = inputElem.val();
    const groupName = inputElem.prop('id');

    data[groupName].groupName = inputVal;

    const groupData = data[groupName];

    if (inputVal !== '') {
        chrome.storage.sync.set({[groupName]: groupData},() => {
            console.log('group name successfully saved!');
            location.reload();
        });
    }
});

// delete group
$(document).on('click','.delete-group',function(e) {

    const groupName = $(this).parents('.card').prop('id');

    delete data[groupName];

    chrome.storage.sync.remove(groupName,() => {
        console.log('successfully deleted group!');
    });

    $(this).parents('.card').remove();
});

// edit group name
$(document).on('click','.edit-group-name',function(e) {

    const groupName = $(this).parents('.card').prop('id');

    const name = data[groupName].groupName;

    $(this).parents('.card-content > div.row').replaceWith(`
        <div class="row">
            <form class="add-group-form">
                <div class="input-field col s10 l8">
                    <label for="${groupName}" class="active">Group Name</label>
                    <input id="${groupName}" type="text" class="validate" value="${name}" autofocus>
                </div>
                <div class="col s1 l1">
                    <button class="waves-effect waves-light btn right" type="submit"><i class="material-icons">save</i></button>
                </div>
            </form>
        </div>
    `);
});

// change group color
$(document).on('click','.change-color',function(e) {
    const groupId = $(this).attr('class').split(' ')[1];

    $(this).parents('.card').next('.color-picker-placeholder').replaceWith(`
        <div class="color-picker-package-cont">
            <div class="row color-picker-cont" id="color-picker-cont${groupId}">
                <div class="col color-picker">
                    <div id="colorpicker${groupId}" class="color-picker-input"></div>
                </div>
            </div>
            <div class="row color-picker-buttons-cont" id="color-picker-buttons-cont${groupId}">
                <div class="col color-picker-buttons">
                    <div class="row">
                        <div class="col">
                            <button class="btn save-color ${groupId}"><i class="material-icons">save</i></button>
                        </div>
                        <div class="col">
                            <button class="btn close-color-picker red accent-2 ${groupId}"><i class="material-icons">close</i></button>
                        </div>
                    </div>
                    
                </div>
                
            </div>
        </div>
        
        
    `);

    // initialize && control color picker
    chrome.storage.sync.get([groupId],res => {
        if (res[groupId].color) {
            const rgbColor = tinycolor(res[groupId].color).toHexString();
            $.farbtastic(`#colorpicker${groupId}`).setColor(rgbColor);
        }
        $.farbtastic(`#colorpicker${groupId}`).linkTo(color => {
            const hexColor = tinycolor(color);
            const rgbRightShadow = hexColor.setAlpha(.14).toRgbString();
            const rgbTopShadow = hexColor.setAlpha(.12).toRgbString();
            const rgbLeftShadow = hexColor.setAlpha(.2).toRgbString();
            const boxShadow = `0 2px 2px 0 ${rgbRightShadow}, 0 3px 1px -2px ${rgbTopShadow}, 0 1px 5px 0 ${rgbLeftShadow}`;

            $(this).parents('.card').css('color',`${color}`);
            $(this).parents('.card').css('box-shadow',`${boxShadow}`);
            $(this).parents('.card').find('.url-text').css('color',color);
        });
    });

});

// save color from color picker
$(document).on('click','.save-color',function(e) {
    const groupId = `group${$(this).parents('.color-picker-buttons-cont').prop('id').slice(-1)}`;
    let color = tinycolor($.farbtastic(`#colorpicker${groupId}`).color).toRgbString();

    if (!color) {
        color = 'rgb(0,0,0)';
    }


    data[groupId].color = color;
    chrome.storage.sync.set({[groupId]: data[groupId]}, () => {
        console.log('color has been saved successfully!');
        // location.reload();

        $(this).parent().next().find('.close-color-picker').trigger('click');
    });
});

// close color picker
$(document).on('click','.close-color-picker',function(e) {
    const groupId = `group${$(this).parents('.color-picker-buttons-cont').prop('id').slice(-1)}`;
    $(this).parents('.color-picker-package-cont').replaceWith(`
        <div class="color-picker-placeholder"></div>
    `);

    const rgbColor = tinycolor(data[groupId].color);
    $(`div[id="${groupId}"]`).css('color',`${rgbColor.toRgbString()}`);
    $(`div[id="${groupId}"]`).find('.url-text').css('color',`${rgbColor.toRgbString()}`);
    const rgbRightShadow = rgbColor.setAlpha(.14).toRgbString();
    const rgbTopShadow = rgbColor.setAlpha(.12).toRgbString();
    const rgbLeftShadow = rgbColor.setAlpha(.2).toRgbString();
    const boxShadow = `0 2px 2px 0 ${rgbRightShadow}, 0 3px 1px -2px ${rgbTopShadow}, 0 1px 5px 0 ${rgbLeftShadow}`;
    $(`div[id="${groupId}"]`).css('box-shadow',`${boxShadow}`);
});



// Add new link form
$(document).on('click','.add-link',function() {

    const groupName = $(this).parents('.card-content').find('.card-title').prop('id');

    const urlNum = idGenerator(urlFormIds);
    // urlFormIds.push(urlNum);

    $(this).parents('.new-url-data').prev().after(`
        <div class="row">
            <form class="add-url-form" id="new-url-form-${urlNum}">
                <div class="row">
                    <div class="input-field col s4 l4">
                        <label for="urlName${urlNum}">Name</label>
                        <input id="urlName${urlNum}" type="text" class="validate url-name-input" autofocus>
                    </div>
                    <div class="input-field col s8 l6">
                      <label for="url${urlNum}">Url</label>
                      <input id="url${urlNum}" type="text" class="validate url-input">
                    </div>
                    <div class="col s12 l1">
                        <button class="waves-effect waves-light btn" type="submit"><i class="material-icons">save</i></i></button>
                    </div>
                    <div class="col s12 l1">
                        <button class="waves-effect waves-light btn red accent-2 url-delete" type="button"><i class="material-icons">delete</i></button>
                    </div>
                </div>
            </form>
        </div>
    `);
});

// onSubmit add-url-form
$(document).on('submit','.add-url-form',function(e) {
    e.preventDefault();

    const url = $(this).find('.url-input').val();
    const linkName = $(this).find('.url-name-input').val();
    const urlId = parseInt($(this).prop('id').slice(-1));

    axios.get(`${'https://cors-anywhere.herokuapp.com/'}https://besticon-demo.herokuapp.com/allicons.json?url=${url}`)
        .then(res => {

            const iconLink = res.data.icons[0].url;
            const groupName = $(this).parents('.card-content').find('.card-title').prop('id');

            if (urlFormIds.includes(urlId)) {
                data[groupName].data.forEach((urlData,index) => {
                    if (urlData.urlId === urlId) {
                        data[groupName].data[index] = { urlId, url, iconLink, linkName };
                    }
                });
            } else {
                data[groupName].data.push({ urlId, url, iconLink, linkName });
            }

            const groupData = data[groupName];
            chrome.storage.sync.set({
                [groupName]: groupData
            },() => {
                console.log('stored successfully!');
                location.reload();
            });


        },err => {
            if (err.response.status === 404) {
                console.log('invalid url');
            }
        });
});

// Delete url input
$(document).on('click','.url-delete',function(e) {
    e.preventDefault();
    $(this).parents('form[class="add-url-form"]').remove();
});

// Edit url
$(document).on('click','.url-edit',function(e) {
    const name = $(this).parents('.url-buttons').find('a').text().trim();

    const url = $(this).parents('.url-buttons').find('a').prop('href').slice(8);

    const urlNum = $(this).parents('.url-buttons').prop('id').slice(-1);

    urlFormIds.push(urlNum);




    $(this).parents('.url-buttons').replaceWith(`
        <div class="row">
            <form class="add-url-form" id="new-url-form-${urlNum}">
                <div class="row">
                    <div class="input-field col s4 l4">
                        <label for="urlName${urlNum}" class="active">Name</label>
                        <input id="urlName${urlNum}" type="text" class="validate url-name-input" value="${name}" autofocus>
                    </div>
                    <div class="input-field col s8 l6">
                      <label for="url${urlNum}" class="active">Url</label>
                      <input id="url${urlNum}" type="text" class="validate url-input" value="${url}">
                    </div>
                    <div class="col s12 l1">
                        <button class="waves-effect waves-light btn" type="submit"><i class="material-icons">save</i></i></button>
                    </div>
                    <div class="col s12 l1">
                        <button class="waves-effect waves-light btn red accent-2 url-delete" type="button"><i class="material-icons">delete</i></button>
                    </div>
                </div>
            </form>
        </div>
    `);
});

// delete url data
$(document).on('click','.url-delete',function(e) {
    e.preventDefault();

    const groupName = $(this).parents('.card-content').find('.card-title').prop('id');
    const urlId = parseInt($(this).parents('.url-buttons').prop('id').slice(-1));

    data[groupName].data.forEach((urlData,index) => {
        if (urlData.urlId === urlId) {
            data[groupName].data.splice(index,1);
        }
    });
    const groupData = data[groupName];

    chrome.storage.sync.set({[groupName]: groupData});

    $(this).parents('.url-buttons').remove();
});


// delete group data


// Chrome storage data structure
/*

const data = {
    'group${index}': {
        groupName: '',
        color: '',
        data: [
            {
                urlId: 0,
                linkName: '',
                url: '',
                iconLink: ''
            }
        ]
    }
}

*/