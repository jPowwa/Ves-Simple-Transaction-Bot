const {
	SlashCommandBuilder,
	EmbedBuilder,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
	ComponentType,
} = require('discord.js');

const { teamRoles, transactionChannel, staffChannel, captainID, coCaptainID, teamPlayerID } = require('../config.json')

function checkCaptain(sender, team, captain, coCaptain) {
	//Captain Check
	console.log(sender.roles.cache.has(captain.id));
	console.log(sender.roles.cache.has(coCaptain.id));
	console.log(sender.roles.cache.has(team.id));

	if (sender.roles.cache.has(captain.id) && sender.roles.cache.has(team.id) || sender.roles.cache.has(coCaptain.id) && sender.roles.cache.has(team.id)) {
		return true;
	} else {
		return false;
	}
}

function checkCaptainOnly(sender, team, captain) {
	//Captain Check
	console.log(sender.roles.cache.has(captain.id));
	console.log(sender.roles.cache.has(team.id));

	if (sender.roles.cache.has(captain.id) && sender.roles.cache.has(team.id)) {
		return true;
	} else {
		return false;
	}
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('transaction')
		.setDescription('make a transaction')
		.addStringOption(option =>
			option
				.setName('transaction-type')
				.setDescription('The type of transaction')
				.setRequired(true)
				.addChoices(
					{ name: "invite", value: "invite" },
					{ name: "set-co-captain", value: "co-captain" },
					{ name: "disband", value: "disband" },
					{ name: "give-captain", value: "captain" },
					{ name: "kick", value: "kick" },
				)
		)
		.addUserOption(option =>
			option
				.setName('player')
				.setDescription('Player to do transaction on')
				.setRequired(true)
		)
		.addRoleOption(option =>
			option
				.setName('team')
				.setDescription('team to do transaction for')
				.setRequired(true)
		),

	async execute(interaction) {
		//Get options
		let transactionType = interaction.options.getString('transaction-type');
		let player = interaction.options.getUser('player');
		let member = interaction.guild.members.cache.get(player.id);
		let team = interaction.options.getRole('team');
		let sender = interaction.member;

		let captain = interaction.guild.roles.cache.find(r => r.id === captainID);
		let coCaptain = interaction.guild.roles.cache.find(r => r.id === coCaptainID);

		let teamPlayer = interaction.guild.roles.cache.find(r => r.id === teamPlayerID);
		console.log(teamPlayer, coCaptain, captain);

		console.log(transactionChannel);

		//Check if team is a team
		let teamIsTeam = false;

		teamRoles.forEach((obj) => {
			if ((obj) == team) {
				teamIsTeam = true;
			};
		})

		if (!teamIsTeam) {
			interaction.reply({ content: "This isn't a team role, please @ an actual team.", ephemeral: true });
			return;
		};

		if (transactionType == "invite") {
			if (checkCaptain(sender, team, captain, coCaptain)) {
				console.log(member.roles.cache.has(teamPlayer.id));
				//Check if user is on a team
				if (member.roles.cache.has(teamPlayer.id)) {
					interaction.reply({ content: member.name + " is already on a team", ephemeral: true });
					return;
				}

				//Check if team is full
				let index = 0;
				let members = await interaction.guild.members.fetch();

				members.forEach((obj) => {
					if (obj.roles.cache.get(team.id)) {
						index++;
					}
				})

				if(index >= 12) {
					interaction.reply({ content: "Your team is already full.", ephemeral: true });
					return;
				}

				interaction.guild.channels.cache.get(transactionChannel).send(`${member} was invited to ${team}`);

				//create invite embed
				const inviteEmbed = new EmbedBuilder()
					.setTitle("You've been invited to " + team.name)
					.setDescription("You've been invited to " + team.name + " by " + interaction.member.name + " accept or decline the invite using the buttons below")
					.setColor(0xee4b2b);

				//create buttons
				const acceptButton = new ButtonBuilder()
					.setCustomId("accept-invite")
					.setStyle(ButtonStyle.Success)
					.setLabel("Accept Invite");

				const declineButton = new ButtonBuilder()
					.setCustomId("decline-invite")
					.setStyle(ButtonStyle.Danger)
					.setLabel("Decline Invite");

				const buttonRow = new ActionRowBuilder().addComponents(acceptButton, declineButton);

				const reply = await player.send({ embeds: [inviteEmbed], components: [buttonRow] });

				const filter = (i) => i.user.id === player.id;

				const collector = reply.createMessageComponentCollector({
					componentType: ComponentType.Button,
					filter,
				})

				collector.on('collect', (action) => {
					if (action.customId === 'accept-invite') {
						interaction.guild.channels.cache.get(transactionChannel).send(`<@${player.id}> joins ${team}`);
						try {
							member.roles.add(teamPlayer);
							member.roles.add(team);
						} catch (err) {
							console.error(err);
							action.reply("An error occured, try again later");
						}

						action.reply("You accepted the invite from " + team.name);
					}

					if (action.customId === 'decline-invite') {
						interaction.guild.channels.cache.get(transactionChannel).send(`<@${player.id}> declined the invite from ${team}`);
						action.reply("You declined the invite from " + team.name);
					}
				})

				interaction.reply({ content: "Succesfully Invited " + member + " to " + team.name, ephemeral: true });
			}
			else {
				//They are not captain
				interaction.reply("You are not the captain of " + team.name);
				return;
			}
		}

		if (transactionType == "kick") {
			if (!checkCaptain(sender, team, captain, coCaptain)) {
				interaction.reply({ content: "You are not the captain of " + team.name, ephemeral: true });
			}

			if (member.roles.cache.get(team.id)) {
				member.roles.remove(team);
				member.roles.remove(teamPlayer);
				interaction.guild.channels.cache.get(transactionChannel).send(`<@${player.id}> has been kicked from ${team.name}`);
				interaction.reply({ content: "Succesfully kicked " + member.name + " from " + team.name + "." });
			}
		}

		if (transactionType == "disband") {
			if (!checkCaptainOnly(sender, team, captain)) {
				interaction.reply({ content: "You are not the captain of " + team.name, ephemeral: true });
				return;
			}

			const disbandEmbed = new EmbedBuilder()
				.setTitle("Are you sure?")
				.setDescription("Are you sure you want to disband " + team.name + "? Please confirm by pressing the buttons below.")
				.setColor(0xee4b2b);

			//create buttons
			const disband = new ButtonBuilder()
				.setCustomId("disband")
				.setStyle(ButtonStyle.Danger)
				.setLabel("DISBAND");

			const noDisband = new ButtonBuilder()
				.setCustomId("no-disband")
				.setStyle(ButtonStyle.Success)
				.setLabel("STAY SAFE");

			const buttonRow = new ActionRowBuilder().addComponents(disband, noDisband);

			const reply = await interaction.channel.send({ embeds: [disbandEmbed], components: [buttonRow], ephemeral: true });

			const collector = reply.createMessageComponentCollector({
				componentType: ComponentType.Button
			});

			collector.on('collect', async (action) => {
				if (action.customId == "no-disband") {
					interaction.reply({ content: "Your team has not been disbanded", ephemeral: true });
				}

				if (action.customId == "disband") {
					let members = await interaction.guild.members.fetch();
					let teamMembers = [];

					members.forEach((obj) => {
						if (obj.roles.cache.get(team.id)) {
							teamMembers.push(obj);
						}
					})

					teamMembers.forEach((obj) => {
						obj.roles.remove(team);
						if (obj.roles.cache.get(captain.id)) {
							obj.roles.remove(captain);
						} else if (obj.roles.cache.get(coCaptain.id)) {
							obj.roles.remove(coCaptain);
						} else if (obj.roles.cache.get(teamPlayer.id)) {
							obj.roles.remove(teamPlayer);
						}
					})

					interaction.guild.channels.cache.get(staffChannel).send("@everyone " + team.name + " has been disbanded please take correct actions by removing the role after removing it from the config.json file inside of the bot folder");

					interaction.reply({ content: "Your team has been disbanded (note that the embed might say interaction failed, that's a discord bug)", ephemeral: true });
				}
			})
		}

		if (transactionType == "captain") {
			console.log("1");
			if (!checkCaptainOnly(sender, team, captain)) {
				interaction.reply({ content: "You are not the captain of the selected team", ephemeral: true });
				return;
			}

			console.log("2");
			interaction.member.roles.remove(captain).catch((err) => console.err(err));

			interaction.member.roles.add(teamPlayer);

			console.log("3");
			if (member.roles.cache.has(coCaptain.id)) {
				member.roles.remove(coCaptain);
				member.roles.add(captain);

				interaction.reply({ content: "Gave captain to " + `${member}` + " succesfully", ephemeral: true });
				return;
			}

			console.log("4");
			member.roles.remove(teamPlayer);
			member.roles.add(captain);

			interaction.reply({ content: "Gave captain to " + `${member}` + " succesfully", ephemeral: true });
		}

		if (transactionType == "co-captain") {
			if (!checkCaptainOnly(sender, team, captain)) return;

			if (member.roles.cache.has(coCaptain.id)) {
				interaction.reply({ content: `${member}` + " is already the Co Captain.", ephemeral: true });
				return;
			}

			member.roles.remove(teamPlayer);
			member.roles.add(coCaptain);

			interaction.reply({ content: "Gave co-captain to " + `${member}` + " succesfully", ephemeral: true });
		}
	},
};
