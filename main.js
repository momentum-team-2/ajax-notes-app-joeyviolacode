let serverURL = "http://localhost:3000/notes"
let notes = []















function refreshLocalDB() {
    fetch(serverURL)
        .then(res => res.json())
        .then(data => addToLocal(data))
}

function addToLocal(arrOfNotes) {
    notes = []
    if (arrOfNotes.length > 0) {
        for (let note of arrOfNotes) {
            notes.push(noteFromRes(note))
        }
    }
}


function Note(title = "", body = "", tags = [], created = new Date(), modified = new Date(), id = null) {
    this.id = id
    this.title = title
    this.body = body
    this.modified = modified
    this.created = created
    this.tags = tags

    this.getID = () => this.id
    this.getDateCreated = () => moment(created).format("MM-DD-YYYY")
    this.getDateModified = () => moment(modified).format("MM-DD-YYYY")
    this.getBody = () => this.body
    this.getTitle = () => this.title
    this.thisNote = function() {return { "title" : this.title, "body" : this.body, "tags" : this.tags, "modified" : this.modified, "created" : this.created }}

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

