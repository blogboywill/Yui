module.exports = (client) => {

  /*
  PERMISSION LEVEL FUNCTION
  This is a very basic permission system for commands which uses "levels"
  "spaces" are intentionally left black so you can add them if you want.
  NEVER GIVE ANYONE BUT OWNER THE LEVEL 11! By default this can run any
  command including the VERY DANGEROUS `eval` and `exec` commands!
  */
  client.permlevel = message => {
    let permlvl = 0;

    const permOrder = client.config.permLevels.slice(0).sort((p, c) => p.level < c.level ? 1 : -1);

    while (permOrder.length) {
      const currentLevel = permOrder.shift();
      if (message.guild && currentLevel.guildOnly) continue;
      if (currentLevel.check(message)) {
        permlvl = currentLevel.level;
        break;
      }
    }
    return permlvl;
  };


  /*
  LOGGING FUNCTION
  Logs to console. Future patches may include time+colors
  */
  client.log = (type, msg, title) => {
    if (!title) title = "Log";
    console.log(`[${type}] [${title}]${msg}`);
  };


  /*
  SINGLE-LINE AWAITMESSAGE
  A simple way to grab a single reply, from the user that initiated
  the command. Useful to get "precisions" on certain things...
  USAGE
  const response = await client.awaitReply(msg, "Favourite Color?");
  msg.reply(`Oh, I really love ${response} too!`);
  */
  client.awaitReply = async (msg, question, limit = 60000) => {
    const filter = m=>m.author.id = msg.author.id;
    await msg.channel.send(question);
    try {
      const collected = await msg.channel.awaitMessages(filter, { max: 1, time: limit, errors: ["time"] });
      return collected.first().content;
    } catch (e) {
      return false;
    }
  };


  client.pointsMonitor = (client, message) => {
    const guild = message.guild.id;
    const author = message.author.id;
    const settings = client.settings.get(guild);
   let prefix = false;
    for(const prop of settings.prefix){
      if (message.content.indexOf(prop) == 0) prefix = prop;
    }
    if(message.content.startsWith(prefix)) return;
    const score = client.points.get(author) || { points: 0, level: 1 };
    const credits = client.credits.get(author) || {credits: 0};
    score.points++;
    const curLevel = Math.floor(0.1 * Math.sqrt(score.points)) + 1;
    if (score.level < curLevel) {
      client.lvlUp(client, message, curLevel);
      score.level = curLevel;
      credits.credits++;
      console.log(credits);
    }
    client.points.set(author, score);
    client.credits.set(author, credits);
  };
  

  client.serverPointsMonitor = (client, message) => {
    const guild = message.guild.id;
    const author = message.author.id;
    const settings = client.settings.get(guild);
    let prefix = false;
    for(const prop of settings.prefix){
      if (message.content.indexOf(prop) == 0) prefix = prop;
    }
    if(message.content.startsWith(prefix)) return;
    var score = client.serverPoints.get(guild) || {[author]:{ points: 0}};
    if(score[author] === undefined){
      score[author] = {points:1}
    }else{
      score[author].points++;
    }
    client.serverPoints.set(guild, score);
    console.log(score);
  }

  /*
  MESSAGE CLEAN FUNCTION
  "Clean" removes @everyone pings, as well as tokens, and makes code blocks
  escaped so they're shown more easily. As a bonus it resolves promises
  and stringifies objects!
  This is mostly only used by the Eval and Exec commands.
  */
  client.clean = async (client, text) => {
    if (text && text.constructor.name == "Promise")
      text = await text;
    if (typeof evaled !== "string")
      text = require("util").inspect(text, {depth: 0});

    text = text
      .replace(/`/g, "`" + String.fromCharCode(8203))
      .replace(/@/g, "@" + String.fromCharCode(8203))
      .replace(client.token, "mfa.VkO_2G4Qv3T--NO--lWetW_tjND--TOKEN--QFTm6YGtzq9PH--4U--tG0");

    return text;
  };

  client.loadCommand = (commandName) => {
    try {
      const props = require(`../${commandName}`);
      client.log("log", `Loading Command: ${props.help.name}`);
      if (props.init) {
        props.init(client);
      }
      client.commands.set(props.help.name, props);
      props.conf.aliases.forEach(alias => {
        client.aliases.set(alias, props.help.name);
      });
      return false;
    } catch (e) {
      return `Unable to load command ${commandName}: ${e}`;
    }
  };

  client.unloadCommand = async (commandName) => {
    var commandIndex;
    if (client.commands.has(commandName)) {
      var i = 0;
      console.log(`commands has commandName`);
      console.log(client.aliases.keyArray());
      commandIndex = client.commands.keyArray().indexOf(commandName);
      command = client.commands.get(commandName);
    } else if (client.aliases.has(commandName)) {
      commandIndex = client.commands.Array().indexOf(commandName);
      for(var prop in client.commands){
        var i = 0;
        if(prop.aliases.get(commandName)){
          commandIndex = i;
        }
        else{
          i++;
        }
     // command = client.commands.indexOf(client.aliases.get(commandName));
    }
  }
  console.log(commandIndex);
    if (!commandIndex) return `The command \`${commandName}\` doesn't seem to exist, nor is it an alias. Try again!`;

    if (command.shutdown) {
      await command.shutdown(client);
    }
    console.log(client.cmdFiles[commandIndex]);
    delete require.cache[require.resolve(`../${client.cmdFiles[commandIndex]}`)];
    return false, client.cmdFiles[commandIndex];
  };

  /* MISCELANEOUS NON-CRITICAL FUNCTIONS */

  // EXTENDING NATIVE TYPES IS BAD PRACTICE. Why? Because if JavaScript adds this
  // later, this conflicts with native code. Also, if some other lib you use does
  // this, a conflict also occurs. KNOWING THIS however, the following 2 methods
  // are, we feel, very useful in code.

  // <String>.toPropercase() returns a proper-cased string such as:
  // "Mary had a little lamb".toProperCase() returns "Mary Had A Little Lamb"
  String.prototype.toProperCase = function() {
    return this.replace(/([^\W_]+[^\s-]*) */g, function(txt) {return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
  };

  // <Array>.random() returns a single random element from an array
  // [1, 2, 3, 4, 5].random() can return 1, 2, 3, 4 or 5.
  Array.prototype.random = function() {
    var Random = require("random-js")();
    return this[Random.integer(0, this.length)];
  };

  // `await client.wait(1000);` to "pause" for 1 second.
  client.wait = require("util").promisify(setTimeout);

  client.isUser = (string) => {
    console.log(`isUser has run`)
    for(i = 0; i < client.guilds.array().length; i++){
      var server = client.guilds.array()[i];
       console.log(server.name)
      for(var e= 0; e < server.members.array().length; e++){
        var member = server.members.array()[e]
        console.log(member.user.username);
        console.log(member.displayName);
        console.log(string);
        if(string == member.user.username || string == member.displayName){
          return member.user;
        }
      }
    }
    return false;
  } 

  // These 2 process methods will catch exceptions and give *more details* about the error and stack trace.
  process.on("uncaughtException", (err) => {
    const errorMsg = err.stack.replace(new RegExp(`${__dirname}/`, "g"), "./");
    console.error("Uncaught Exception: ", errorMsg);
    // Always best practice to let the code crash on uncaught exceptions.
    // Because you should be catching them anyway.
    process.exit(1);
  });

  process.on("unhandledRejection", err => {
    console.error("Uncaught Promise Error: ", err);
  });
};
