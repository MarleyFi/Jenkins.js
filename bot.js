const discord = require("discord.js");
const ytdl = require('ytdl-core');
var fileStream = require('fs');
const streamOptions = { seek: 0, volume: -2 };
const client = new discord.Client();
var streamMsg;
var currentStream;
var vChannel;
var vConnection;

var randomLinks = JSON.parse(fileStream.readFileSync('./links.json', 'utf8'));

// var randomLinks = [
//     "https://www.youtube.com/watch?v=DX-V6FDI1b8", // Livin' in the Sunlight
//     "https://www.youtube.com/watch?v=ZZ5LpwO-An4", // HEYYEYAAEYAAAEYAEYAA
//     "https://www.youtube.com/watch?v=4om1rQKPijI", // Levan Polkka
//     "https://www.youtube.com/watch?v=DLzxrzFCyOs", // Never Gonna Give You Up
//     "https://www.youtube.com/watch?v=wd63P7mYXzo", // Nigga stole My Bike!
//     "https://www.youtube.com/watch?v=hBe0VCso0qs", // Fresh Prince of Bel Air
//     "https://www.youtube.com/watch?v=vjVQGw5EIPc", // Shaco the Tank Engine
//     "https://www.youtube.com/watch?v=azEvfD4C6ow", // Bagger 288
//     "https://www.youtube.com/watch?v=kZwhNFOn4ik", // INTERIOR CROCODILE ALLIGATOR
//     "https://www.youtube.com/watch?v=AAcnFOcu57s", // I Got Bitches
//     "https://www.youtube.com/watch?v=919VXer591k", // Mariachi
//     "https://www.youtube.com/watch?v=afP71xwLI8Y" // Blyat
// ]


//#####################################
// LoginEvents
//#####################################

client.on("ready", () => {
    console.log("Ready");
});

client.on("message", message => {

    if (!message.content.startsWith("/"))
        return;

    if (message.author.bot)
        return;

    var args = message.content.split(/[ ]+/);


    if (message.channel.type != "dm") {
        //message.delete();
    }

    if (isCommand("music", message)) {
		message.delete();
        var commands = [
            "### Music commands ###",
            "/play <URL>",
            "/random",
            "/resume",
            "/pause",
            "/stop",
        ];

        var msgToSend = NewLine() + "```Markdown" + NewLine();
        for (var i = 0; i < commands.length; i++) {
            msgToSend += commands[i] + NewLine();
        }
        msgToSend += "```";

        message.author.sendMessage(msgToSend);
    }

    if (isCommand("random", message)) {
		message.delete();
        var link;
        if (args.length == 2) {
            link = getLink(args[1]);
            if (link === "") {
                return;
            }
        }
        else {
            link = getRandomLink();
        }

        defineVChannel(message).join()
            .then(connection => {
                vConnection = connection;
                const stream = ytdl(link, { filter: 'audioonly' });
                currentStream = connection.playStream(stream, streamOptions);
                var tempMsg;

                message.channel.sendMessage("/**random** " + link)
                    .then(message => tempMsg = message).catch(console.error);

                message.channel.sendMessage(" by **" + message.author.username + "**")
                    .then(message => streamMsg = message).catch(console.error);

                currentStream.on("end", (stream) => {
                    tempMsg.delete();
                    streamMsg.delete();
                });
            })
            .catch(console.error);
    }

    if (isCommand("play", message, args)) {
		message.delete();
        getVChannel(message).join()
            .then(connection => {
                vConnection = connection;
                try {
                    const stream = ytdl(args[1], { filter: 'audioonly' });
                } catch (err) {
                    message.author.sendMessage("Invalid URL <@" + message.author.id + ">");
                    return;
                }
                currentStream = connection.playStream(stream, streamOptions);

                var tempMsg;

                message.channel.sendMessage("Now playing " + args[1])
                    .then(message => tempMsg = message).catch(console.error);

                message.channel.sendMessage(" by **" + message.author.username + "**")
                    .then(message => streamMsg = message).catch(console.error);

                currentStream.on("end", (stream) => {
                    tempMsg.delete();
                    streamMsg.delete();
                });
            })
            .catch(console.error);
    }

    if (isCommand("resume", message)) {
		message.delete();
        currentStream.resume();
        streamMsg.edit("resumed by **" + message.author.username + "**").catch(console.error);
    }

    if (isCommand("pause", message)) {
		message.delete();
        currentStream.pause();
        streamMsg.edit("paused by **" + message.author.username + "**").catch(console.error);
    }

    if (isCommand("stop", message)) {
		message.delete();
        currentStream.end();
    }

    if (isCommand("leave", message)) {
		message.delete();
        if (client.voice.connections.length >= 1)
            client.voice.connections.first().disconnect().catch(console.error);
    }

    if (isCommand("addrandom", message)) {
		message.delete();
        var newObj = {
            "name": args[1],
            "url": args[2]
        }

        ///addrandom Lulz TestLink/watch123

        randomLinks['links'].push(newObj);
        var jsonString = JSON.stringify(randomLinks);
        
        var wstream = fileStream.createWriteStream('./links.json');
        wstream.write(jsonString);
        wstream.end();
    }

    if (isCommand("ping", message)) {
		message.channel.sendMessage("Pong! - Jenkins.js")
    }
});

function isCommand(aliases, msg, args) {
    return msg.content.toLowerCase().startsWith("/" + aliases);
}

function arrayContains(toFind, array) {
    return (array.indexOf(toFind) > -1);
}

function pluck(array) {
    return array.map(function (item) {
        return item["name"];
    });
}

function hasRole(member, role) {
    if (pluck(member.roles).includes(role)) {
        return true;
    }
    return false;
}


function nukeMessages(message, messageCount) {
    message.channel.fetchMessages({ limit: messageCount }).then(messages => message.channel.bulkDelete(messages)).catch(console.error);
}

function NewLine() {
    return "\r\n";
}

function getRandomLink() {
    var link = randomLinks.links[Math.floor((Math.random() * randomLinks.links.length) + 0)];
    return link.url;
}

function getLink(searchTerm) {
    var link = "";
    randomLinks.links.forEach(function (item) {
        if (item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
            link = item.url.toString();
        }
    })
    return link;
}

function isUserAdmin(message) {
    return (message.author.id === 111794715690549248);
}

function sendMessageToAdmin(message) {
    client.users.get('111794715690549248').sendMessage(message);
}

function getVChannel(message) {
    var channel = message.guild.channels.filter(chln => {
        return chln.type == 'voice' && chln.members.array().length >= 1
    }).first();
    if (channel) {
        vChannel = channel;
        return channel;
    }
    return null;
}

function defineVChannel(message) {
    // var channel = message.author.client.voice.connections.filter(g => {
    //     return g.type == 'voice'}).first();
    //     if(channel != null) {
    //         vChannel = channel;
    //         return channel;
    //     }
    // var vChannel = client.channels.filter(g => {
    //     return g.type == 'voice' && g.name == 'Main-Channel';
    // }).first();
    // return vChannel;

    var channel;

    channel = client.channels.filter(chln => {
        return chln.id == 271262784119898113 && chln.type == 'voice' // Area FiftyBOT Test-Channel
    }).first();
    if (channel && channel.members.array().length >= 1) {
        vChannel = channel;
        return channel;
    }

    channel = client.channels.filter(chln => {
        return chln.id == 201693574889340929 && chln.type == 'voice' // Zockeria Main-Channel
    }).first();
    if (channel && channel.members.array().length >= 1) {
        vChannel = channel;
        return channel;
    }

    channel = client.channels.filter(chln => {
        return chln.id == 295226485244166145 && chln.type == 'voice' // Bonobo-Squad Palmdunsig
    }).first();
    if (channel && channel.members.array().length >= 1) {
        vChannel = channel;
        return channel;
    }

    channel = client.channels.filter(chln => {
        return chln.type == 'voice' && chln.members.array().length >= 1 // Anderer
    }).first();
    if (channel && channel.members.array().length >= 1) {
        vChannel = channel;
        return channel;
    }
}
