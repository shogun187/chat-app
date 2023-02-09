const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

// Receiving messages
socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
            username: message.username,
            message: message.text,
            createdAt: moment(message.createdAt).format('h:mm a')
        }
    )
    $messages.insertAdjacentHTML('beforeend', html)
})

// Sending messages
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    $messageFormButton.setAttribute('disabled', 'disabled') // disabled button
    const message = e.target.elements.message.value

    socket.emit('sendMessage', message, (error) => {

        $messageFormButton.removeAttribute('disabled') // re-enable button
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {
            console.log(error)
        } else {
            console.log('Message delivered')
        }
    })
})

// Receiving location
socket.on('locationMessage', (message) => {
    const html = Mustache.render(locationTemplate, {
            username: message.username,
            location: message.location,
            createdAt: moment(message.createdAt).format('h:mm a')
        }
    )
    $messages.insertAdjacentHTML('beforeend', html)
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {room, users})
    document.querySelector('#sidebar').innerHTML = html
})

// Sending location
$sendLocationButton.addEventListener('click', (e) => {
        if (!navigator.geolocation) {
            return alert('Geolocation is not supported by your browser')
        }

        $sendLocationButton.setAttribute('disabled', 'disabled') // disable button

        navigator.geolocation.getCurrentPosition((position) => {
                socket.emit("sendLocation", {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    }, () => {
                        $sendLocationButton.removeAttribute('disabled') // re-enable button
                        console.log('Location shared!')
                    }
                )
            }
        )
    }
)

socket.emit('join', {username, room}, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})