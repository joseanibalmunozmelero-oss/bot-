// Bot de derecho simple
document.addEventListener('DOMContentLoaded', function() {
    // --- LOGIN CON GOOGLE ---
    window.onGoogleSignIn = function(googleUser) {
        const profile = googleUser.getBasicProfile();
        document.getElementById('user-info').style.display = 'block';
        document.getElementById('user-info').innerHTML = `<b>Bienvenido, ${profile.getName()}</b><br><img src="${profile.getImageUrl()}" width="40" style="border-radius:50%"> <br>${profile.getEmail()}`;
        document.getElementById('google-signin-btn').style.display = 'none';
    };
    // Render Google button
    if (document.getElementById('google-signin-btn')) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = function() {
            google.accounts.id.initialize({
                client_id: '6985525590-9b8r050ib4f09fh7rdf8j47eqrrknhr0.apps.googleusercontent.com',
                callback: (response) => {
                    // Decodificar JWT para obtener datos básicos
                    const base64Url = response.credential.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));
                    const data = JSON.parse(jsonPayload);
                    document.getElementById('user-info').style.display = 'block';
                    document.getElementById('user-info').innerHTML = `<b>Bienvenido, ${data.name}</b><br><img src="${data.picture}" width="40" style="border-radius:50%"> <br>${data.email}`;
                    document.getElementById('google-signin-btn').style.display = 'none';
                }
            });
            google.accounts.id.renderButton(
                document.getElementById('google-signin-btn'),
                { theme: 'outline', size: 'large' }
            );
        };
        document.body.appendChild(script);
    }

    // --- FORO ---
    const foroForm = document.getElementById('foro-form');
    const foroTextarea = document.getElementById('foro-textarea');
    const foroMensajes = document.getElementById('foro-mensajes');
    if (foroForm && foroTextarea && foroMensajes) {
        foroForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const mensaje = foroTextarea.value.trim();
            if (mensaje) {
                const div = document.createElement('div');
                div.className = 'foro-msg';
                div.innerHTML = `<b>Usuario:</b> ${mensaje}`;
                foroMensajes.appendChild(div);
                foroTextarea.value = '';
                foroMensajes.scrollTop = foroMensajes.scrollHeight;
            }
        });
    }

    // --- CHAT GENERAL ---
    const chatGeneralForm = document.getElementById('chat-general-form');
    const chatGeneralInput = document.getElementById('chat-general-input');
    const chatGeneralBox = document.getElementById('chat-general-box');
    if (chatGeneralForm && chatGeneralInput && chatGeneralBox) {
        chatGeneralForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const mensaje = chatGeneralInput.value.trim();
            if (mensaje) {
                const div = document.createElement('div');
                div.className = 'user-msg';
                div.innerHTML = `<b>Tú:</b> ${mensaje}`;
                chatGeneralBox.appendChild(div);
                chatGeneralInput.value = '';
                chatGeneralBox.scrollTop = chatGeneralBox.scrollHeight;
            }
        });
    }

    // --- CONTACTO ---
    const contactoForm = document.getElementById('contacto-form');
    if (contactoForm) {
        contactoForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('¡Mensaje enviado! Nos pondremos en contacto contigo pronto.');
            contactoForm.reset();
        });
    }
    // Manejo de archivos
    const fileInput = document.getElementById('bot-file');
    if (fileInput) {
        fileInput.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (!file) return;
            const ext = file.name.split('.').pop().toLowerCase();
            agregarMensaje('Tú', '[Archivo subido: ' + file.name + ']');
            if (ext === 'txt') {
                const reader = new FileReader();
                reader.onload = function(evt) {
                    analizarArchivo(evt.target.result);
                };
                reader.readAsText(file);
            } else if (ext === 'pdf') {
                // PDF.js
                const reader = new FileReader();
                reader.onload = async function(evt) {
                    const typedarray = new Uint8Array(evt.target.result);
                    try {
                        const pdf = await pdfjsLib.getDocument({data: typedarray}).promise;
                        let texto = '';
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            const content = await page.getTextContent();
                            texto += content.items.map(item => item.str).join(' ') + '\n';
                        }
                        analizarArchivo(texto);
                    } catch (err) {
                        agregarMensaje('Bot', 'No se pudo leer el PDF.');
                    }
                };
                reader.readAsArrayBuffer(file);
            } else if (ext === 'docx') {
                // Mammoth.js
                const reader = new FileReader();
                reader.onload = function(evt) {
                    mammoth.extractRawText({arrayBuffer: evt.target.result})
                        .then(result => {
                            analizarArchivo(result.value);
                        })
                        .catch(() => {
                            agregarMensaje('Bot', 'No se pudo leer el archivo Word.');
                        });
                };
                reader.readAsArrayBuffer(file);
            } else if (ext === 'jpg' || ext === 'jpeg') {
                // Tesseract.js
                const reader = new FileReader();
                reader.onload = function(evt) {
                    Tesseract.recognize(evt.target.result, 'spa')
                        .then(({ data: { text } }) => {
                            analizarArchivo(text);
                        })
                        .catch(() => {
                            agregarMensaje('Bot', 'No se pudo extraer texto de la imagen.');
                        });
                };
                reader.readAsDataURL(file);
            } else if (ext === 'doc') {
                agregarMensaje('Bot', 'El análisis automático de archivos .doc no está soportado en navegadores. Por favor, convierte el archivo a .docx o .txt.');
            } else {
                agregarMensaje('Bot', 'Tipo de archivo no soportado. Por favor, sube un archivo .txt, .pdf, .jpg, .doc o .docx.');
            }
        });
    }

    function analizarArchivo(texto) {
        let encontrado = false;
        for (let r of respuestas) {
            if (r.pregunta.test(texto)) {
                agregarMensaje('Bot', '¡Hola! He analizado tu archivo y encontré información relevante:');
                agregarMensaje('Bot', r.respuesta);
                encontrado = true;
                break;
            }
        }
        if (!encontrado) {
            agregarMensaje('Bot', '¡Hola! He analizado tu archivo pero no encontré coincidencias claras con los temas legales que manejo.');
        }
    }
    const chatForm = document.getElementById('bot-form');
    const chatInput = document.getElementById('bot-input');
    const chatBox = document.getElementById('bot-chat');

    const respuestas = [
        { pregunta: /contrato|contratos/i, respuesta: 'Un contrato es un acuerdo legal entre dos o más partes. Para que sea válido debe contener consentimiento, objeto y causa. ¿Deseas saber cómo redactar uno?' },
        { pregunta: /despido|despedido|laboral/i, respuesta: 'Si fuiste despedido, tienes derecho a recibir una liquidación y puedes impugnar el despido si es injustificado. Consulta tu legislación local para plazos y requisitos.' },
        { pregunta: /divorcio|matrimonio/i, respuesta: 'El divorcio puede ser de mutuo acuerdo o contencioso. Es necesario presentar una demanda y cumplir con los requisitos legales. ¿Te gustaría información sobre los pasos?' },
        { pregunta: /herencia|testamento/i, respuesta: 'La herencia se tramita mediante testamento o sucesión legítima. El testamento debe ser otorgado ante notario. ¿Te interesa saber cómo hacer un testamento?' },
        { pregunta: /penal|delito|acusaci[oó]n/i, respuesta: 'En caso de acusación penal, tienes derecho a un abogado y a guardar silencio. Es importante no declarar sin asesoría legal.' },
        { pregunta: /nuevo procedimiento penal|reforma penal|oralidad penal/i, respuesta: 'El nuevo procedimiento penal introduce la oralidad, la inmediación y la publicidad en los juicios. Busca mayor transparencia, rapidez y respeto a los derechos de las partes. ¿Te gustaría saber sobre etapas o derechos en el nuevo sistema?' },
        { pregunta: /empresa|sociedad|constituci[oó]n/i, respuesta: 'Para constituir una empresa o sociedad, debes inscribirla en el registro mercantil y cumplir con los requisitos fiscales y legales. Es recomendable definir el tipo societario (S.A., S.R.L., etc.) y contar con asesoría legal para los estatutos.' },
        { pregunta: /asesoramiento legal empresa|empresa legal|compliance|cumplimiento/i, respuesta: 'El asesoramiento legal para empresas abarca constitución, contratos, cumplimiento normativo (compliance), protección de datos, propiedad intelectual y defensa ante litigios. Un abogado puede ayudarte a prevenir riesgos legales.' },
        { pregunta: /civil|demanda/i, respuesta: 'Para iniciar una demanda civil, debes presentar una demanda ante el juzgado correspondiente, acompañada de pruebas y documentos.' },
        { pregunta: /arrendamiento|renta|inquilino|propietario/i, respuesta: 'En contratos de arrendamiento, tanto inquilino como propietario tienen derechos y obligaciones. Es recomendable firmar un contrato por escrito.' },
        { pregunta: /alimentos|pensi[oó]n alimenticia/i, respuesta: 'La pensión alimenticia es un derecho de los hijos menores. Puede solicitarse judicialmente si no hay acuerdo entre las partes.' },
        { pregunta: /violencia|orden de alejamiento/i, respuesta: 'Si eres víctima de violencia, puedes solicitar una orden de alejamiento y protección ante la autoridad competente.' },
        { pregunta: /marca|registro de marca/i, respuesta: 'Registrar una marca protege tu producto o servicio. Debes acudir al organismo de propiedad industrial de tu país.' },
        { pregunta: /tr[aá]fico|multa|conducir|licencia/i, respuesta: 'Ante una multa de tráfico, puedes pagarla o recurrirla si consideras que es injusta. Conducir sin licencia puede acarrear sanciones graves.' },
        { pregunta: /menor|tutela|patria potestad/i, respuesta: 'La tutela y patria potestad protegen los derechos de los menores. Los padres tienen deberes y derechos sobre sus hijos.' },
        { pregunta: /fiscal|impuestos|hacienda/i, respuesta: 'El cumplimiento fiscal es obligatorio. Si tienes dudas sobre impuestos, consulta a un contador o abogado fiscalista.' },
        { pregunta: /acoso|discriminaci[oó]n/i, respuesta: 'El acoso y la discriminación están prohibidos por la ley. Puedes denunciar estos hechos ante las autoridades o instancias correspondientes.' },
        { pregunta: /sucesi[oó]n|legado/i, respuesta: 'La sucesión es el proceso legal para transferir bienes tras el fallecimiento de una persona. Puede ser testamentaria o legítima.' },
        { pregunta: /amparo/i, respuesta: 'El amparo es un recurso legal para proteger tus derechos fundamentales frente a actos de autoridad.' },
        { pregunta: /adopci[oó]n/i, respuesta: 'La adopción es un proceso legal que otorga derechos y obligaciones entre adoptante y adoptado. Requiere trámite judicial.' },
        { pregunta: /nacionalidad|residencia|extranjero/i, respuesta: 'Para obtener la nacionalidad o residencia, debes cumplir con los requisitos legales y presentar la documentación ante la autoridad migratoria.' },
        { pregunta: /.*/, respuesta: 'Lo siento, no tengo información específica sobre esa consulta. Por favor, sé más específico o contacta a un abogado.' }
    ];

    chatForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const pregunta = chatInput.value.trim();
        if (!pregunta) return;
        agregarMensaje('Tú', pregunta);
        let saludo = '';
        if (/^hola$|^buenas|^buenos|^saludos|^buen d[ií]a|^buenas tardes|^buenas noches|^hey|^hello/i.test(pregunta)) {
            saludo = '¡Hola! ¿En qué puedo ayudarte con tu consulta legal?';
        } else {
            saludo = '¡Hola!';
        }
        let respuesta = respuestas.find(r => r.pregunta.test(pregunta));
        if (respuesta) {
            agregarMensaje('Bot', saludo);
            agregarMensaje('Bot', respuesta.respuesta);
        } else {
            agregarMensaje('Bot', saludo);
            agregarMensaje('Bot', 'No tengo información específica sobre esa consulta.');
        }
        chatInput.value = '';
    });

    function agregarMensaje(remitente, texto) {
        const div = document.createElement('div');
        div.className = remitente === 'Bot' ? 'bot-msg' : 'user-msg';
        div.innerHTML = `<strong>${remitente}:</strong> ${texto}`;
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
});
