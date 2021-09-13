const { Airgram, Auth, prompt, toObject } = require('airgram')

const fs = require('fs')
const https = require('https')
const request = require('request')

const filterPhrases = [
    'na',
    'naa',
    'na-',
    'na-all',
    'na@all',
    'admin',
    'pinned',
    '/report',
    '/ban',
    'ban',
    'report',
    'spam',
    'spamming',
    'spammers',
    'stupid',
    'advertisement',
    '@bestybuddy',
    'link',
    'contact',
    'scam',
    'questions',
    'question',
    'contact',
    'stop',
    'whatsApp',
    'help',
]
const searchPhrases = [
    'available',
    'open',
    'opened',
    'availabl',
    'avaiable',
    'availale',
    'vailable',
    'avaiable',
    'avalable',
    'vailable',
    'aailable',
    'vailable',
    'availablee',
    'availablle',
    'availabble',
    'availaable',
    'availlable',
    'avaiilable',
    'avaailable',
    'avvailable',
    'aavailable',
    'availabel',
    'availalbe',
    'availbale',
    'avaialble',
    'avaliable',
    'avialable',
    'aavilable',
    'vaailable',
    'available.',
    'available-',
    'available@',
    'cancelled',
    'cancelling',
]
const Telegram_Group = 777000

const H1B_H4_Dropbox_Group = -1001371184682
const H1B_H4_Dropbox_Channel = '@h1b_h4_dropbox_alert'

const H1B_H4_Regular_Group_1 = -1001452973962
const H1B_H4_Regular_Group_2 = -1001533015824
const H1B_H4_Regular_Channel = '@h1b_h4_regular_alert'

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

const sendTextMessageToGroup = async (dataToSend) => {
    airgram.api
        .sendMessage({
            chatId: 'enter_group_chat_id_here',
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

const sendPictureMessageToGroup = async (photoId) => {
    airgram.api
        .sendMessage({
            chatId: 'enter_group_chat_id_here',
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

const sendMessageToBot = (message, botToken, channelId) => {
    const uriMessage = encodeURIComponent(message)
    const path = `/bot${botToken}/sendMessage?chat_id=${channelId}&text=${uriMessage}`
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

const sendPhotoToBot = async (photoId, botToken, channelId) => {
    const downloadedFile = await airgram.api.downloadFile({
        fileId: photoId,
        priority: 32,
        limit: 0,
        synchronous: true,
    })

    const options = {
        method: 'POST',
        url: `https://api.telegram.org/bot${botToken}/sendPhoto?chat_id=${channelId}`,
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

        if (
            chatId === H1B_H4_Dropbox_Group ||
            chatId === H1B_H4_Regular_Group_1 ||
            chatId === H1B_H4_Regular_Group_2
            // chatId === Telegram_Group
        ) {
            // console.log('[content]:', content)

            if (isTextMessage(content)) {
                const actualMessage = content.text.text
                const actualMessageArr = actualMessage.split(' ')
                const found = actualMessageArr.some((r) =>
                    searchPhrases.includes(r.toLowerCase())
                )
                const isQuestion = actualMessage.includes('?')
                const isNoOrNotString = actualMessageArr.some((r) =>
                    ['no', 'not'].includes(r.toLowerCase())
                )

                if (found && !isQuestion && !isNoOrNotString) {
                    const message = `${actualMessage}`
                    if (chatId === H1B_H4_Dropbox_Group) {
                        await sendMessageToBot(
                            message,
                            process.env.DROPBOX_BOT_TOKEN,
                            H1B_H4_Dropbox_Channel
                        )
                    }
                    if (
                        chatId === H1B_H4_Regular_Group_1 ||
                        chatId === H1B_H4_Regular_Group_2
                    ) {
                        await sendMessageToBot(
                            message,
                            process.env.REGULAR_BOT_TOKEN,
                            H1B_H4_Regular_Channel
                        )
                    }
                    /*
                    if (chatId === Telegram_Group) {
                        await sendMessageToBot(
                            message,
                            process.env.REGULAR_BOT_TOKEN,
                            H1B_H4_Regular_Channel
                        )
                    }
                    */
                }
            }

            if (isPictureMessage(content)) {
                const photos = content.photo.sizes
                const xPhoto = photos.find((p) => p.type === 'x')
                const mPhoto = photos.find((p) => p.type === 'm')

                const { id, size, local, remote } = xPhoto
                    ? xPhoto.photo
                    : mPhoto.photo
                if (chatId === H1B_H4_Dropbox_Group) {
                    await sendPhotoToBot(
                        id,
                        process.env.DROPBOX_BOT_TOKEN,
                        H1B_H4_Dropbox_Channel
                    )
                }
                if (chatId === H1B_H4_Regular_Group) {
                    await sendPhotoToBot(
                        id,
                        process.env.REGULAR_BOT_TOKEN,
                        H1B_H4_Regular_Channel
                    )
                }
                /*
                if (chatId === Telegram_Group) {
                    await sendPhotoToBot(
                        id,
                        process.env.REGULAR_BOT_TOKEN,
                        H1B_H4_Regular_Channel
                    )
                }
                */
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
