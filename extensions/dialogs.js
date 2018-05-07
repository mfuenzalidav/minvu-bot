var dialogs = require('../dialogs/serviceDialogs')

var Dialogs = {
    getDialogs: function (builder, bot) {
        var RSHTramo = new dialogs.RSHTramo(builder);
        var SPSEstadoPago = new dialogs.SPSEstadoPago(builder);
        var RSHGrupoFamiliar = new dialogs.RSHGrupoFamiliar(builder);
        var RCivilInfoGeneral = new dialogs.RCivilInfoGeneral(builder);

        var Ayuda = new dialogs.Ayuda(builder);

        var ArandaIncidente = new dialogs.ArandaIncidente(builder);
        var ArandaRequerimiento = new dialogs.ArandaRequerimiento(builder);
        var JuegoAhorcado = new dialogs.JuegoAhorcado(builder, bot)
        var DS49EstadoPostulacion = new dialogs.DS49EstadoPostulacion(builder, bot)
        var DS49EstadoProyecto = new dialogs.DS49EstadoProyecto(builder, bot)


        return [
            { dialogId: RSHTramo.dialogId, dialog: RSHTramo.dialog },                           //ObtenerTramoRsh
            { dialogId: RSHGrupoFamiliar.dialogId, dialog: RSHGrupoFamiliar.dialog },           //ObtenerGrupoFamiliarRsh
            { dialogId: RCivilInfoGeneral.dialogId, dialog: RCivilInfoGeneral.dialog },         //RegistroCivilInfoGeneral
            { dialogId: Ayuda.dialogId, dialog: Ayuda.dialog },                                 //MenuAyuda
            { dialogId: SPSEstadoPago.dialogId, dialog: SPSEstadoPago.dialog },                 //SPSEstadoPago
            { dialogId: ArandaIncidente.dialogId, dialog: ArandaIncidente.dialog },             //ArandaIncidente
            { dialogId: ArandaRequerimiento.dialogId, dialog: ArandaRequerimiento.dialog },     //ArandaRequerimiento
            { dialogId: JuegoAhorcado.dialogId, dialog: JuegoAhorcado.dialog },                 //JuegoAhorcado
            { dialogId: DS49EstadoPostulacion.dialogId, dialog: DS49EstadoPostulacion.dialog }, //DS49EstadoPostulacion
            { dialogId: DS49EstadoProyecto.dialogId, dialog: DS49EstadoProyecto.dialog },       //DS49EstadoProyecto
        ]
    }
}

module.exports = Dialogs;