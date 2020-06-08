//FUTURE:   Add ability to pin note to top of notes list.   
//          MAYBE Add selectable background-colors for notes
//          Make search more robust so it doesn't only search contiguous strings but looks to match words
//          SOME WORK DONE HERE Do more CSS to make things look a little less flat...change background color and give some depth to elements/buttons
//          Remove stock delete confirmation and build something into page for that.
//          Add tags panel so clicking on a tag listed only items with matching tag


const serverURL = "http://localhost:3000/notes"
const PREVIEW_LENGTH = 90
let currentID = null
let notes = []
let currentNote = null

refreshLocalDB()
initializeUI()


//This set of functions initializes all of the buttons with event listeners and the functions they
//call to do their jobs
function initializeUI() {
    initializeNew()
    initializeSave()
    initializeDelete()
    initializeSearch()
}

function initializeNew() {
    let button = document.getElementById("new-button")
    button.addEventListener("click", clearNote)
}

//Clears the current note from the display fields and flushes the search string
function clearNote() {
    currentID = null;
        document.getElementById("title-input").value = ""
        document.getElementById("body-input").value = ""
        document.getElementById("tags-input").value = ""
        document.getElementById("search-input").value = ""
        handleSearch()
}

function initializeDelete() {
    let button = document.getElementById("delete-button")
    button.addEventListener("click", deleteNote)
}

//Deletes a note and clears all fields before refresing the local DB
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

//saves a note, either in a new spot in the DB or by updating an old post
function  saveNote() {
    let title = document.getElementById("title-input").value
    let body = document.getElementById("body-input").value
    let tags = document.getElementById("tags-input").value.split(" ")
    if (currentID === null) {
        let note = new Note(title, body, tags)
        note.addToDB()
        refreshLocalDBCurr()
        document.getElementById("search-input").value = ""
    } else {
        let note = getNoteByID(Number(currentID))
        note.title = title
        note.body = body
        note.tags = tags
        note.updateNote()
        refreshLocalDB()
    }
}

function initializeSearch() {
    let searchBar = document.getElementById("search-input")
    searchBar.addEventListener("input", handleSearch)
}

//Updates the list of notes in real time based on the contents of the search field
function handleSearch() {
    let searchBar = document.getElementById("search-input")
    if (searchBar.value.length === 0) {
        populateThumbs(notes)
    } else {
        let filteredArray = notes.filter( note => note.body.toLowerCase().match(searchBar.value.toLowerCase()) != null || note.tags.includes(searchBar.value) || note.title.toLowerCase().match(searchBar.value.toLowerCase()) != null)
        populateThumbs(filteredArray)
    }
}





//Below are functions for handling the local database


//This function is called to refresh the local DB when an already existing note is saved.
function refreshLocalDB() {
    fetch(serverURL)
        .then(res => res.json())
        .then( function(data) {
            addToLocal(data.reverse())
            populateThumbs(notes)
        })
}

//This functions is called to refresh the local DB when a new note is saved.  It is necessary in this case
//to set the currentID to that matching the new note so further operations may be performed on it
function refreshLocalDBCurr() {
    fetch(serverURL)
        .then(res => res.json())
        .then( function(data) {
            let arr = data
            currentID = arr[arr.length - 1].id
            addToLocal(arr)
            populateThumbs(notes)
        })
}

//This function adds all of the thumbnails to the list of notes and attaches their event listeners
function populateThumbs(arrOfNotes) {  
    let thumbTemplate = document.getElementById("thumbnail-template").innerHTML
    let thumbGenerator = _.template(thumbTemplate)
    let thumbTarget = document.querySelector("#selector-display")
    thumbTarget.innerHTML = ""
    
    for (let note of arrOfNotes) {
        let thumbHTML = thumbGenerator(note.thisThumbNote())
        thumbTarget.innerHTML += thumbHTML
    }

    let list = document.querySelectorAll(".thumbnail")
    for (let node of list) {
        node.addEventListener("click", selectNote)
    }
}

//populates the local DB given a JSON array, then asks that the new list be sorted from present
//to past according to when a note is last modified
function addToLocal(arrOfNotes) {
    notes = []
    if (arrOfNotes.length > 0) {
        for (let note of arrOfNotes) {
            notes.push(noteFromRes(note))
        }
    }
    notes = mostRecentFirst(notes)
}

//helper function for the above.  Copies an array, sorts it from present to past according to modification
//date, then returns the new array
function mostRecentFirst(arrayOfNotes) {
    let recentArray = [...arrayOfNotes].sort( (a, b) => new Date(b.modified) - new Date(a.modified))
    return recentArray
}

//Figures out which note is needed, adds its data to the display fields, and stores the currentID for further operations
function selectNote(e) {
    console.log(e.target.id)
    currentID = e.target.closest(".thumbnail").id
    n = getNoteByID(Number(currentID))
    document.getElementById("title-input").value = n.title
    document.getElementById("body-input").value = n.body
    document.getElementById("tags-input").value = n.tags.join(" ")
}





//Below is the Note object and functions used for finding Notes and converting server feedback into Notes.
//Also included are functions to ask notes to add, delete, or update themselves on the server.
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

function noteFromRes(values) {
    return new Note(values.title, values.body, values.tags, values.modified, values.created, values.id)
}

