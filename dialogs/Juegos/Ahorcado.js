
function Ahorcado(builder, bot) {
    //this.builder = builder

    this.dialogId = 'JuegosAhorcado'

    let vidas
    let palabras = ['Avatar', 'Rocky', '300']
    let palabra
    let letra
    let enmascarada


    this.dialog = [(session, args, next) => {
        vidas = 5
        palabra = palabras[Math.floor(Math.random() * (palabras.length - 0)) + 0]
        enmascarada = palabra.replace(/[\S]/ig, '-')
        session.send('Adivina las palabras ocultas');
        session.beginDialog('/AdivinarAhorcado');
    }]

    const ObtenerSiguienteDialogo = (session, results) => {
        var nextDialog = '';
        if (results.response.length > 1) {
            if (results.response.toUpperCase() === palabra.toUpperCase()) {
                enmascarada = palabra;
                nextDialog = '/GanarAhorcado';
            }
            else {
                vidas--;
                nextDialog = vidas === 0 ? '/PerderAhorcado' : '/AdivinarAhorcado';
            }
        }
        else {
            letra = results.response;
            enmascarada = RevelarLetraPalabraEnmascarada(session, results);

            if (enmascarada == palabra) {
                nextDialog = '/GanarAhorcado';
            }
            else {
                nextDialog = vidas === 0 ? '/PerderAhorcado' : '/AdivinarAhorcado';
            }
        }
        return nextDialog;
    }

    const RevelarLetraPalabraEnmascarada = (session, results) => {
        var largoPalabra = palabra.length;
        var palabraEnmascarada = "";
        var encontrada = false;

        for (var i = 0; i < largoPalabra; i++) {
            var letra = palabra[i];
            if (letra.toUpperCase() === results.response.toUpperCase()) {
                palabraEnmascarada += letra;
                encontrada = true;
            }
            else {
                palabraEnmascarada += enmascarada[i];
            }
        }

        if (encontrada === false) {
            vidas--;
        }

        return palabraEnmascarada;
    }

    bot.dialog('/GanarAhorcado', [
        function (session) {
            session.send(enmascarada);
            session.send('Bien Hecho!');
            session.endDialog();
        }
    ])
    bot.dialog('/PerderAhorcado', [
        function (session) {
            session.send('Juego terminar! Perdiste :(!');
            session.send(palabra);
            session.endDialog();
        }
    ])
    bot.dialog('/AdivinarAhorcado', [
        (session) => {
            session.send('Tienes ' + vidas + ' ' + (vidas == 1 ? 'vida' : 'vidas'));
            console.log(enmascarada)

            builder.Prompts.text(session, enmascarada);
        },
        (session, results) => {
            var nextDialog = ObtenerSiguienteDialogo(session, results);
            session.beginDialog(nextDialog);
        }
    ])

}


exports.Ahorcado = Ahorcado