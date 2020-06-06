const serverURL = "http://localhost:3000/notes"
const PREVIEW_LENGTH = 90;
let notes = []

refreshLocalDB()

function populateThumbs() {  
    let thumbTemplate = document.getElementById("thumbnail-template").innerHTML
    let thumbGenerator = _.template(thumbTemplate)
    let thumbTarget = document.querySelector("#selector-container")
    
    for (let note of notes) {
        let thumbHTML = thumbGenerator(note.thisThumbNote())
        thumbTarget.innerHTML += thumbHTML
    }
}

















//Below are functions for handling the local database
function refreshLocalDB() {
    fetch(serverURL)
        .then(res => res.json())
        .then( function(data) {
            addToLocal(data)
            populateThumbs()
        })
}

function addToLocal(arrOfNotes) {
    notes = []
    if (arrOfNotes.length > 0) {
        for (let note of arrOfNotes) {
            notes.push(noteFromRes(note))
        }
    }
}



//Below is the Note object and functions used for finding Notes and converting server feedback into Notes.
function Note(title = "", body = "", tags = [], created = new Date(), modified = new Date(), id = null) {
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

function noteFromJSON(obj) {
    let values = JSON.parse(obj)
    return new Note(values.title, values.body, values.tags, values.modified, values.created, values.id)
}

function noteFromRes(values) {
    return new Note(values.title, values.body, values.tags, values.modified, values.created, values.id)
}

