//TODO:  Complete display...hook up all wires to add/remove from DB on buttons, select. 
//NEXT:  Add search bar.
//FUTURE: Add tags?  Colors?
//noncritical error on tags.join in select note function---tags aren't staying an array


const serverURL = "http://localhost:3000/notes"
const PREVIEW_LENGTH = 90
let currentID = null
let notes = []
let currentNote = null

refreshLocalDB()
initializeButtons()


//This set of functions initializes all of the buttons with event listeners and the functions they
//call to do their jobs
function initializeButtons() {
    initializeNew()
    initializeSave()
    initializeDelete()
}

function initializeNew() {
    let button = document.getElementById("new-button")
    button.addEventListener("click", clearNote)
}

function clearNote() {
    currentID = null;
        console.log("you clicked")
        document.getElementById("title-input").value = ""
        document.getElementById("body-input").value = ""
        document.getElementById("tags-input").value = ""
}

function initializeDelete() {
    let button = document.getElementById("delete-button")
    button.addEventListener("click", deleteNote)
}

function deleteNote() {
    if (currentID) {
        let conf = confirm("Are you sure you want to delete this note?  This is permanent.")
        if (conf) {
            let n = getNoteByID(Number(currentID))
            n.removeFromDB()
            clearNote()
            refreshLocalDB()
        }
    }
}

function initializeSave() {
    let button = document.getElementById("save-button")
    button.addEventListener("click", saveNote)
}

function  saveNote() {
    let title = document.getElementById("title-input").value
    let body = document.getElementById("body-input").value
    let tags = document.getElementById("tags-input").value
    if (currentID === null) {
        let note = new Note(title, body, tags)
        note.addToDB()
        refreshLocalDBCurr()
    } else {
        let note = getNoteByID(Number(currentID))
        note.title = title
        note.body = body
        note.tags = tags
        note.updateNote()
        refreshLocalDB()
    }
}





//Below are functions for handling the local database
function refreshLocalDB() {
    fetch(serverURL)
        .then(res => res.json())
        .then( function(data) {
            addToLocal(data.reverse())
            populateThumbs()
        })
}

function refreshLocalDBCurr() {
    fetch(serverURL)
        .then(res => res.json())
        .then( function(data) {
            let arr = data.reverse()
            addToLocal(arr)
            populateThumbs()
            currentID = arr[0].id
        })
}

function populateThumbs() {  
    let thumbTemplate = document.getElementById("thumbnail-template").innerHTML
    let thumbGenerator = _.template(thumbTemplate)
    let thumbTarget = document.querySelector("#selector-display")
    thumbTarget.innerHTML = ""
    
    for (let note of notes) {
        let thumbHTML = thumbGenerator(note.thisThumbNote())
        thumbTarget.innerHTML += thumbHTML
    }

    let list = document.querySelectorAll(".thumbnail")
    for (let node of list) {
        node.addEventListener("click", selectNote)
    }
}

function addToLocal(arrOfNotes) {
    notes = []
    if (arrOfNotes.length > 0) {
        for (let note of arrOfNotes) {
            notes.push(noteFromRes(note))
        }
    }
}

function selectNote(e) {
    console.log(e.target.id)
    currentID = e.target.closest(".thumbnail").id
    n = getNoteByID(Number(currentID))
    document.getElementById("title-input").value = n.title
    document.getElementById("body-input").value = n.body
    document.getElementById("tags-input").value = n.tags
}



//Below is the Note object and functions used for finding Notes and converting server feedback into Notes.
function Note(title = "", body = "", tags = [], modified = new Date(), created = new Date(), id = null) {
    this.id = id
    this.title = title
    this.body = body
    this.modified = modified
    this.created = created
    this.tags = tags
    this.bodyShort = getShortBody(this.body)

    this.getID = () => this.id
    this.getDateCreated = () => moment(created).format("MM-DD-YYYY")
    this.getDateModified = () => moment(modified).format("MM-DD-YYYY")
    this.getBody = () => this.body
    this.getTitle = () => this.title
    this.thisNote = function() {return { "title" : this.title, "body" : this.body, "tags" : this.tags, "modified" : this.modified, "created" : this.created, "id" : this.id, "bodyShort" : this.bodyShort}}
    this.thisThumbNote = function() {return { "title" : this.title, "body" : this.body, "tags" : this.tags, "modified" : moment(modified).format("MM-DD-YYYY"), "created" : moment(created).format("MM-DD-YYYY"), "id" : this.id, "bodyShort" : this.bodyShort}}

    this.addToDB = function() {
        fetch(serverURL, {
            method: 'POST',
            headers: {'Content-Type' : "application/json"},
            body: JSON.stringify(this.thisNote())
        })
        refreshLocalDB()
    }

    this.removeFromDB = function() {
        fetch(`${serverURL}/${this.id}`, { 
            method : "DELETE" 
        })
        refreshLocalDB()
    }

    this.updateNote = function() {
        this.modified = new Date()
        fetch(`${serverURL}/${this.id}`, {
            method: "PUT",
            headers: {'Content-Type' : "application/json"},
            body: JSON.stringify(this.thisNote())
        })
        refreshLocalDB()
    }

    function getShortBody(str) {
        if (str.length <= PREVIEW_LENGTH) {
            return str
        } else {
            return str.slice(0,PREVIEW_LENGTH).trim() + "..."
        }
    }
}

function getNoteByID(id) {
    for (let note of notes) {
        if (note.getID() === id) {
            return note
        }
    }
    return null
}

/*function noteFromJSON(obj) {
    let values = JSON.parse(obj)
    return new Note(values.title, values.body, values.tags, values.modified, values.created, values.id)
}*/

function noteFromRes(values) {
    return new Note(values.title, values.body, values.tags, values.modified, values.created, values.id)
}

