const { SlashCommandBuilder } = require('discord.js');

const { teamRoles, transactionChannel } = require("../config.json");

function returnTeamRole(cap, coCap, teamPlayer, member) {
	if(member.roles.cache.has(cap.id)) {
		return "cap"
	} else if(member.roles.cache.has(coCap.id)) {
		return "coCap"
	} else if(member.roles.cache.has(teamPlayer.id)) {
		return "player"
	} else {
		return false;
	}
}

function findTeamCap(captain, team, members) {
	let teamCap;

	members.forEach((obj) => {
		if(obj.roles.cache.has(captain.id) && obj.roles.cache.has(team.id)) {
			teamCap = obj;
		}
	})

	return teamCap;
}

function findTeam(member) {
  console.log(teamRoles[1]);
  console.log(teamRoles[2]);

  let team = false;

  member.roles.cache.forEach((obj) => {
    if(teamRoles.includes(obj.id)) {
      team = obj
    }
  })

  return team;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leave')
		.setDescription('Leave the team you are currently in'),
  
	async execute(interaction) {
    let sender = interaction.member;
    let member = interaction.guild.members.cache.get(sender.id);

    let captain = interaction.guild.roles.cache.find(r => r.name === "Captain");
		let coCaptain = interaction.guild.roles.cache.find(r => r.name === "Co captain");

		let teamPlayer = interaction.guild.roles.cache.find(r => r.name === "Team player");

    let team = findTeam(member);

    let members = await interaction.guild.members.fetch();

    if(!team) {
      interaction.reply({ content: "You are not in a team, please join a team before you consider leaving one", ephemeral: true });
      return;
    }

    if(returnTeamRole(captain, coCaptain, teamPlayer, member) == "cap") {
      interaction.reply({ content: "Please give away team captain to a player you entrust your teams future in before leaving, or disband the team", ephemeral: true });
      return;
    }

    if(member == sender && returnTeamRole(captain, coCaptain, teamPlayer, member) == "player" && member.roles.cache.has(team.id)) {
      interaction.guild.channels.cache.get(transactionChannel).send(`<@${sender.id}> has left ${team.name}, pinging team captain ${findTeamCap(captain, team, members)}`);
      member.roles.remove(team).catch((err) => console.error(err));
      member.roles.remove(teamPlayer).catch((err) => console.error(err));
      interaction.reply({ content: "You succesfully left the team!", ephemeral: true });
    }

    if(member == sender && returnTeamRole(captain, coCaptain, teamPlayer, member) == "coCap" && member.roles.cache.has(team.id)) {
      interaction.guild.channels.cache.get(transactionChannel).send(`<@${sender.id}> has left ${team.name}, pinging team captain ${findTeamCap(captain, team, members)}`);
      member.roles.remove(team).catch((err) => console.error(err));
      member.roles.remove(coCaptain).catch((err) => console.error(err));
      interaction.reply({ content: "You succesfully left the team!", ephemeral: true });
    }
	},
};

