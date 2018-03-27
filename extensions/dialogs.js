var dialogs = require('../dialogs/serviceDialogs')

var Dialogs = {
    getDialogs: function (builder) {
        var RSHTramo = new dialogs.RSHTramo(builder);
        var SPSEstadoPago = new dialogs.SPSEstadoPago(builder);
        var RSHGrupoFamiliar = new dialogs.RSHGrupoFamiliar(builder);
        var RCivilInfoGeneral = new dialogs.RCivilInfoGeneral(builder);
        var Ayuda = new dialogs.Ayuda(builder);

        return [
            { dialogId: RSHTramo.dialogId, dialog: RSHTramo.dialog },                   //ObtenerTramoRsh
            { dialogId: RSHGrupoFamiliar.dialogId, dialog: RSHGrupoFamiliar.dialog },   //ObtenerGrupoFamiliarRsh
            { dialogId: RCivilInfoGeneral.dialogId, dialog: RCivilInfoGeneral.dialog }, //RegistroCivilInfoGeneral
            { dialogId: Ayuda.dialogId, dialog: Ayuda.dialog },                         //MenuAyuda
            { dialogId: SPSEstadoPago.dialogId, dialog: SPSEstadoPago.dialog },         //SPSEstadoPago
        ]
    }
}

module.exports = Dialogs;