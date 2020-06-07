//FUTURE:   Add ability to pin note to top of notes list.   
//          Add selectable background-colors for notes
//          Make search more robust so it doesn't only search contiguous strings but looks to match words
//          Do more CSS to make things look a little less flat...change background color and give some depth to elements/buttons


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

function clearNote() {
    currentID = null;
        console.log("you clicked")
        document.getElementById("title-input").value = ""
        document.getElementById("body-input").value = ""
        document.getElementById("tags-input").value = ""
        document.getElementById("search-input").value = ""
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
function refreshLocalDB() {
    fetch(serverURL)
        .then(res => res.json())
        .then( function(data) {
            addToLocal(data.reverse())
            populateThumbs(notes)
        })
}


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

function addToLocal(arrOfNotes) {
    notes = []
    if (arrOfNotes.length > 0) {
        for (let note of arrOfNotes) {
            notes.push(noteFromRes(note))
        }
    }
    notes = mostRecentFirst(notes)
}

function mostRecentFirst(arrayOfNotes) {
    let recentArray = [...arrayOfNotes].sort( (a, b) => new Date(b.modified) - new Date(a.modified))
    return recentArray
}

function selectNote(e) {
    console.log(e.target.id)
    currentID = e.target.closest(".thumbnail").id
    n = getNoteByID(Number(currentID))
    document.getElementById("title-input").value = n.title
    document.getElementById("body-input").value = n.body
    document.getElementById("tags-input").value = n.tags.join(" ")
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

function noteFromRes(values) {
    return new Note(values.title, values.body, values.tags, values.modified, values.created, values.id)
}

