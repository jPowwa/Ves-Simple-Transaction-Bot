const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const { teamRoles } = require("../config.json")

module.exports = {
	data: new SlashCommandBuilder()
		.setName('roster')
		.setDescription('get roster from any team')
  	.addRoleOption(option =>
			option
				.setName('team')
				.setDescription('team to get roster')
				.setRequired(true)
    ),
  
	async execute(interaction) {
    //Check if role is a team role...
    let optionIsTeamRole = false;

    const option = interaction.options.getRole('team');
    
    teamRoles.forEach((obj) => {
      if((obj) == option) {
       optionIsTeamRole = true 
      };
    })

    if(!optionIsTeamRole) {
      interaction.reply({ content: "This isn't a team role, please @ an actual team.", ephemeral: true });
      return;
    };

    //Since I'm an idiot I'm doing this twice
    let index = 0;
    let members = await interaction.guild.members.fetch();
    
    members.forEach((obj) => {
      if(obj.roles.cache.get(option.id)) {
        index++;
      }
    })

    const allMembers = interaction.guild.members.fetch().then(members => {
      const allOnTeam = members.filter(mmbr => mmbr.roles.cache.get(option.id)).map(m => m.user.tag).join('\n');

      const ListEmbed = new EmbedBuilder()
        .setTitle("Roster of " + option.name)
        .setDescription(allOnTeam)
        .setFooter({ text: index.toString() + "/12" });

      interaction.reply({ embeds: [ListEmbed], ephemeral: true});
    })
	},
};

