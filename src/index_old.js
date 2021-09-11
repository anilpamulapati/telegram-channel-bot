const { Airgram, Auth, prompt, toObject } = require('airgram')

const filterPhrases = ['NA', 'Na', 'na', 'Admin']

const airgram = new Airgram({
    apiId: process.env.APP_ID,
    apiHash: process.env.APP_HASH,
    command: process.env.TDLIB_COMMAND,
    logVerbosityLevel: 1,
})

airgram.use(
    new Auth({
        code: () => prompt('Please enter the secret code:\n'),
        phoneNumber: () => prompt('Please enter your phone number:\n'),
    })
)

void (async function () {
    const me = toObject(await airgram.api.getMe())
    //  console.log('[Me] ', me)

    const { response: chats } = await airgram.api.getChats({
        limit: 10,
        offsetChatId: 0,
        offsetOrder: '9223372036854775807',
    })
    // console.log('[My chats] ', chats)
})()

// Getting all updates
airgram.use((ctx, next) => {
    if ('update' in ctx) {
        // console.log(`[all updates][${ctx._}]`, JSON.stringify(ctx.update))
    }
    return next()
})

// Getting new messages
airgram.on('updateNewMessage', async ({ update }) => {
    const { message } = update
    console.log('message.chatId:', message.chatId)

    //getting user name details
    const userInfo = await airgram.api.getUser({
        userId: 496513822,
    })

    const fullName = `${userInfo.response.firstName} ${userInfo.response.lastName}`
    console.log('userInfo:', fullName)

    // if (message.chatId === -1001371184682) {
    if (message.chatId === 777000) {
        // console.log("message.chatId:", message.chatId);
        // if(message.chatId === -1001371184682){
        // console.log('[new message]', message)
        if (message.content['_'] === 'messageText') {
            const data = `#️⃣${fullName}#️⃣: ${message.content.text.text}`
            console.log('[message]:', data)
            const incomingMessage = data.split(' ')
            const found = incomingMessage.some((r) => filterPhrases.includes(r))
            console.log('[found]:', found)
            if (!found) {
                airgram.api.sendMessage({
                    chatId: '-425383243',
                    inputMessageContent: {
                        _: 'inputMessageText',
                        text: {
                            _: 'formattedText',
                            text: data,
                        },
                    },
                })
                console.log('[Forward Message]', data)
            }
        }
        if (message.content['_'] === 'messagePhoto') {
            const photos = message.content.photo.sizes
            const xPhoto = photos.find((p) => p.type === 'x')
            //console.log("photos:", photos);

            // const thumbnail = message.content.photo.minithumbnail
            // console.log("thumbnail:", thumbnail);
            const { id, size, local, remote } = xPhoto.photo
            const { width, height } = xPhoto
            airgram.api.sendMessage({
                chatId: '-425383243',
                inputMessageContent: {
                    _: 'inputMessagePhoto',
                    photo: {
                        _: 'inputFileId',
                        id,
                    },
                },
            })
        }

        /*
   
    */
    }

    //}

    /*
  (node:46976) UnhandledPromiseRejectionWarning: TypeError: Cannot read property 'text' of undefined
    at airgram.on (/Users/anil/NodeJS/airgram-js-example-master/src/index.js:42:37)
    at /Users/anil/NodeJS/airgram-js-example-master/node_modules/@airgram/core/components/Composer.js:30:64
(node:46976) UnhandledPromiseRejectionWarning: Unhandled promise rejection. This error originated either by throwing inside of an async function without a catch block, or by rejecting a promise which was not handled with .catch(). (rejection id: 2)
(node:46976) [DEP0018] DeprecationWarning: Unhandled promise rejections are deprecated. In the future, promise rejections that are not handled will terminate the Node.js process with a non-zero exit code.
*/
})
