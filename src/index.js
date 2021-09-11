const { Airgram, Auth, prompt, toObject } = require('airgram')

const fs = require('fs')
const https = require('https')
const request = require('request')

const filterPhrases = ['NA', 'Na', 'na', 'Admin', 'admin']

const H1B_Group_DropBox_Chat_Id = -1001371184682
const Telegram_Group_Chat_Id = 777000
const Automated_Telegram_Channel = -1329071312

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

const getUserName = async (userId) => {
    const userInfo = await airgram.api.getUser({
        userId,
    })
    return `${userInfo.response.firstName} ${userInfo.response.lastName}`
}

const isTextMessage = (content) => content['_'] === 'messageText'

const isPictureMessage = (content) => content['_'] === 'messagePhoto'

const sendTextMessage = async (dataToSend) => {
    airgram.api
        .sendMessage({
            chatId: Automated_Telegram_Channel,
            inputMessageContent: {
                _: 'inputMessageText',
                text: {
                    _: 'formattedText',
                    text: dataToSend,
                },
            },
        })
        .catch((err) => console.log('Text Message Error:', err))
}

const sendPictureMessage = async (photoId) => {
    airgram.api
        .sendMessage({
            chatId: Automated_Telegram_Channel,
            inputMessageContent: {
                _: 'inputMessagePhoto',
                photo: {
                    _: 'inputFileId',
                    id: photoId,
                },
            },
        })
        .catch((err) => console.log('Picture Message Error:', err))
}

const sendMessageToBot = (message) => {
    const uriMessage = encodeURIComponent(message)
    const path = `/bot${process.env.BOT_TOKEN}/sendMessage?chat_id=${process.env.CHANNEL_ID}&text=${uriMessage}`
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.telegram.org',
            path,
            method: 'GET',
        }
        const req = https.request(options, (res) => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error('statusCode=' + res.statusCode))
            }

            var body = []
            res.on('data', function (chunk) {
                body.push(chunk)
            })
            res.on('end', function () {
                try {
                    body = JSON.parse(Buffer.concat(body).toString())
                } catch (e) {
                    reject(e)
                }
                resolve(body)
            })
        })

        req.on('error', (error) => {
            console.error(error)
            reject(error.message)
        })

        req.end()
    })
}

const sendPhotoToBot = async (photoId) => {
    const downloadedFile = await airgram.api.downloadFile({
        fileId: photoId,
        priority: 32,
        limit: 0,
        synchronous: true,
    })

    const options = {
        method: 'POST',
        url: `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendPhoto?chat_id=${process.env.CHANNEL_ID}`,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        formData: {
            photo: fs.createReadStream(downloadedFile.response.local.path),
        },
    }

    return new Promise((resolve, reject) => {
        request(options, (err, res, body) => {
            if (err) reject(err)
            resolve(res)
        })
    })
}

void (async function () {
    const me = toObject(await airgram.api.getMe())
    const { response: chats } = await airgram.api.getChats({
        limit: 10,
        offsetChatId: 0,
        offsetOrder: '9223372036854775807',
    })
})()

airgram.on('updateNewMessage', async ({ update }) => {
    try {
        // console.log('[Incoming Message]:', update.message)
        const {
            chatId,
            content,
            sender: { userId },
        } = update.message

        // console.log('[chatId]:', message.chatId)
        // console.log('[content]:', content)

        if (chatId === H1B_Group_DropBox_Chat_Id) {
            console.log('[content]:', content)
            const fullName = await getUserName(userId)

            if (isTextMessage(content)) {
                const actualMessage = content.text.text
                const actualMessageArr = actualMessage.split(' ')
                const found = actualMessageArr.some((r) =>
                    filterPhrases.includes(r)
                )
                if (!found) {
                    const message = `#️⃣${fullName}#️⃣: ${actualMessage}`
                    await sendMessageToBot(message)
                }
            }

            if (isPictureMessage(content)) {
                const photos = content.photo.sizes
                const xPhoto = photos.find((p) => p.type === 'x')
                const { id, size, local, remote } = xPhoto.photo
                await sendPhotoToBot(id)
            }
        }
    } catch (error) {
        console.log('Error Occured:', error)
    }
})

airgram.catch((error) => {
    if (error.name === 'TDLibError') {
        console.error('TDLib error:', error)
    } else {
        console.log('Other error:', error)
    }
})
