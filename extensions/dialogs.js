var dialogs = require('../dialogs/serviceDialogs')

var Dialogs = {
    getDialogs: function (builder) {
        var RSHTramo = new dialogs.RSHTramo(builder);
        var RSHGrupoFamiliar = new dialogs.RSHGrupoFamiliar(builder);
        var RCivilInfoGeneral = new dialogs.RCivilInfoGeneral(builder);

        return [
            { dialogId: RSHTramo.dialogId, dialog: RSHTramo.dialog },                   //ObtenerTramoRsh
            { dialogId: RSHGrupoFamiliar.dialogId, dialog: RSHGrupoFamiliar.dialog },   //ObtenerGrupoFamiliarRsh
            { dialogId: RCivilInfoGeneral.dialogId, dialog: RCivilInfoGeneral.dialog }, //RegistroCivilInfoGeneral
        ]
    }
}

module.exports = Dialogs;