from html import escape


def template_novo_chamado(
    protocolo: str,
    solicitante_nome: str,
    solicitante_email: str,
    unidade: str,
    categoria: str,
    assunto: str,
) -> tuple[str, str]:
    protocolo = escape(protocolo)
    solicitante_nome = escape(solicitante_nome)
    solicitante_email = escape(solicitante_email)
    unidade = escape(unidade)
    categoria = escape(categoria)
    assunto = escape(assunto)

    texto = f"""
Novo chamado aberto - {protocolo}

Solicitante: {solicitante_nome}
E-mail: {solicitante_email}
Unidade: {unidade}
Categoria: {categoria}
Assunto: {assunto}

Acesse o Service Desk da NTU para visualizar e atender o chamado.
""".strip()

    html = f"""
<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0; padding:0; background:#f4f6f5; font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f5; padding:32px 16px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0"
                       style="max-width:600px; width:100%; background:#ffffff; border:1px solid #dce3df; border-radius:8px;">

                    <tr>
                        <td style="background:#18201d; padding:24px 32px;">
                            <div style="color:#ffffff; font-size:22px; font-weight:bold;">
                                Service Desk
                            </div>
                            <div style="color:#aebbb4; font-size:14px; margin-top:4px;">
                                Núcleo de Tecnologia da Informação - NTI
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:32px;">
                            <div style="color:#159455; font-size:13px; font-weight:bold;">
                                NOVO CHAMADO
                            </div>

                            <h2 style="color:#16201b; margin:8px 0 24px;">
                                {protocolo}
                            </h2>

                            <table width="100%" cellpadding="8" cellspacing="0"
                                   style="font-size:14px; color:#445049;">
                                <tr>
                                    <td><strong>Solicitante</strong></td>
                                    <td>{solicitante_nome}</td>
                                </tr>
                                <tr>
                                    <td><strong>E-mail</strong></td>
                                    <td>{solicitante_email}</td>
                                </tr>
                                <tr>
                                    <td><strong>Unidade</strong></td>
                                    <td>{unidade}</td>
                                </tr>
                                <tr>
                                    <td><strong>Categoria</strong></td>
                                    <td>{categoria}</td>
                                </tr>
                                <tr>
                                    <td><strong>Assunto</strong></td>
                                    <td>{assunto}</td>
                                </tr>
                            </table>

                            <p style="margin:28px 0 0; color:#445049; font-size:14px;">
                                Acesse o Service Desk da NTU para visualizar
                                e atender o chamado.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="border-top:1px solid #dce3df; padding:18px 32px;
                                   color:#7a857f; font-size:12px;">
                            Mensagem automática do Service Desk NTU.
                            Não responda a este e-mail.
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
""".strip()

    return texto, html

def template_chamado_recebido(
    protocolo: str,
    solicitante_nome: str,
    categoria: str,
    assunto: str,
    chamado_id: int,
    app_url: str,
) -> tuple[str, str]:
    protocolo = escape(protocolo)
    solicitante_nome = escape(solicitante_nome)
    categoria = escape(categoria)
    assunto = escape(assunto)

    url_chamado = f"{app_url.rstrip('/')}/chamados/{chamado_id}"

    texto = f"""
Olá, {solicitante_nome}.

Seu chamado foi registrado com sucesso no Service Desk da NTU.

Protocolo: {protocolo}
Assunto: {assunto}
Categoria: {categoria}
Status: Aberto

Nossa equipe de NTI foi notificada e dará continuidade ao atendimento.

Acompanhe seu chamado:
{url_chamado}

Mensagem automática do Service Desk NTU.
Não responda a este e-mail.
""".strip()

    html = f"""
<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0; padding:0; background:#f4f6f5; font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f5; padding:32px 16px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0"
                       style="max-width:600px; width:100%; background:#ffffff; border:1px solid #dce3df; border-radius:8px;">

                    <tr>
                        <td style="background:#18201d; padding:24px 32px;">
                            <div style="color:#ffffff; font-size:22px; font-weight:bold;">
                                Service Desk
                            </div>
                            <div style="color:#aebbb4; font-size:14px; margin-top:4px;">
                                Núcleo de Tecnologia da Informação - NTI
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:32px;">
                            <div style="color:#159455; font-size:13px; font-weight:bold;">
                                CHAMADO RECEBIDO
                            </div>

                            <h2 style="color:#16201b; margin:8px 0 16px;">
                                {protocolo}
                            </h2>

                            <p style="color:#445049; font-size:14px;">
                                Olá, <strong>{solicitante_nome}</strong>.
                            </p>

                            <p style="color:#445049; font-size:14px;">
                                Seu chamado foi registrado com sucesso.
                                Nossa equipe de NTI foi notificada e dará continuidade ao atendimento.
                            </p>

                            <table width="100%" cellpadding="8" cellspacing="0"
                                   style="font-size:14px; color:#445049; margin:20px 0;">
                                <tr>
                                    <td><strong>Assunto</strong></td>
                                    <td>{assunto}</td>
                                </tr>
                                <tr>
                                    <td><strong>Categoria</strong></td>
                                    <td>{categoria}</td>
                                </tr>
                                <tr>
                                    <td><strong>Status</strong></td>
                                    <td>Aberto</td>
                                </tr>
                            </table>

                            <table cellpadding="0" cellspacing="0" style="margin-top:28px;">
                                <tr>
                                    <td style="background:#159455; border-radius:6px;">
                                        <a href="{url_chamado}"
                                           style="display:inline-block; padding:12px 20px;
                                                  color:#ffffff; text-decoration:none;
                                                  font-size:14px; font-weight:bold;">
                                            Acompanhar chamado
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="border-top:1px solid #dce3df; padding:18px 32px;
                                   color:#7a857f; font-size:12px;">
                            Mensagem automática do Service Desk NTU.
                            Não responda a este e-mail.
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
""".strip()

    return texto, html

def template_nova_interacao(
    protocolo: str,
    destinatario_nome: str,
    autor_nome: str,
    assunto: str,
    mensagem: str,
    chamado_id: int,
    app_url: str,
) -> tuple[str, str]:
    protocolo = escape(protocolo)
    destinatario_nome = escape(destinatario_nome)
    autor_nome = escape(autor_nome)
    assunto = escape(assunto)
    mensagem = escape(mensagem)

    url_chamado = f"{app_url.rstrip('/')}/chamados/{chamado_id}"

    texto = f"""
Olá, {destinatario_nome}.

Uma nova interação foi registrada no chamado {protocolo}.

Assunto: {assunto}
Enviado por: {autor_nome}

Mensagem:
{mensagem}

Acesse o Service Desk para visualizar o chamado:
{url_chamado}

Mensagem automática do Service Desk NTU.
Não responda a este e-mail.
""".strip()

    html = f"""
<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0; padding:0; background:#f4f6f5; font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#f4f6f5; padding:32px 16px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0"
                       style="max-width:600px; width:100%; background:#ffffff;
                              border:1px solid #dce3df; border-radius:8px;">

                    <tr>
                        <td style="background:#18201d; padding:24px 32px;">
                            <div style="color:#ffffff; font-size:22px; font-weight:bold;">
                                Service Desk
                            </div>
                            <div style="color:#aebbb4; font-size:14px; margin-top:4px;">
                                Núcleo de Tecnologia da Informação - NTI
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:32px;">
                            <div style="color:#159455; font-size:13px; font-weight:bold;">
                                NOVA INTERAÇÃO
                            </div>

                            <h2 style="color:#16201b; margin:8px 0 16px;">
                                {protocolo}
                            </h2>

                            <p style="color:#445049; font-size:14px;">
                                Olá, <strong>{destinatario_nome}</strong>.
                            </p>

                            <p style="color:#445049; font-size:14px;">
                                Uma nova interação foi registrada no seu chamado.
                            </p>

                            <table width="100%" cellpadding="8" cellspacing="0"
                                   style="font-size:14px; color:#445049; margin:20px 0;">
                                <tr>
                                    <td><strong>Assunto</strong></td>
                                    <td>{assunto}</td>
                                </tr>
                                <tr>
                                    <td><strong>Enviado por</strong></td>
                                    <td>{autor_nome}</td>
                                </tr>
                            </table>

                            <div style="background:#f4f6f5; border-left:4px solid #159455;
                                        padding:16px; margin:20px 0; color:#445049;
                                        font-size:14px; line-height:1.5;">
                                {mensagem}
                            </div>

                            <table cellpadding="0" cellspacing="0" style="margin-top:28px;">
                                <tr>
                                    <td style="background:#159455; border-radius:6px;">
                                        <a href="{url_chamado}"
                                           style="display:inline-block; padding:12px 20px;
                                                  color:#ffffff; text-decoration:none;
                                                  font-size:14px; font-weight:bold;">
                                            Ver chamado
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="border-top:1px solid #dce3df; padding:18px 32px;
                                   color:#7a857f; font-size:12px;">
                            Mensagem automática do Service Desk NTU.
                            Não responda a este e-mail.
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
""".strip()

    return texto, html

def template_chamado_atribuido(
    protocolo: str,
    tecnico_nome: str,
    solicitante_nome: str,
    unidade: str,
    categoria: str,
    assunto: str,
    prioridade: str,
    chamado_id: int,
    app_url: str,
) -> tuple[str, str]:
    protocolo = escape(protocolo)
    tecnico_nome = escape(tecnico_nome)
    solicitante_nome = escape(solicitante_nome)
    unidade = escape(unidade)
    categoria = escape(categoria)
    assunto = escape(assunto)
    prioridade = escape(prioridade.capitalize())

    url_chamado = f"{app_url.rstrip('/')}/chamados/{chamado_id}"

    corpo_texto = f"""
Olá, {tecnico_nome}.

O chamado {protocolo} foi atribuído a você.

Assunto: {assunto}
Solicitante: {solicitante_nome}
Unidade: {unidade}
Categoria: {categoria}
Prioridade: {prioridade}

Acesse o Service Desk:
{url_chamado}
""".strip()

    corpo_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #333333;">
        <div style="background: #26332d; padding: 24px; color: white;">
            <div style="font-size: 13px; color: #9fd4b5; font-weight: bold;">
                CHAMADO ATRIBUÍDO
            </div>
            <div style="font-size: 22px; font-weight: bold; margin-top: 6px;">
                {protocolo}
            </div>
        </div>

        <div style="padding: 24px; border: 1px solid #dddddd; border-top: none;">
            <p>Olá, <strong>{tecnico_nome}</strong>.</p>

            <p>Este chamado foi atribuído a você para atendimento.</p>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Assunto</td>
                    <td style="padding: 8px 0;">{assunto}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Solicitante</td>
                    <td style="padding: 8px 0;">{solicitante_nome}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Unidade</td>
                    <td style="padding: 8px 0;">{unidade}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Categoria</td>
                    <td style="padding: 8px 0;">{categoria}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Prioridade</td>
                    <td style="padding: 8px 0;">{prioridade}</td>
                </tr>
            </table>

            <div style="margin-top: 25px;">
                <a href="{url_chamado}"
                   style="
                       background: #198754;
                       color: white;
                       text-decoration: none;
                       padding: 12px 20px;
                       border-radius: 4px;
                       display: inline-block;
                       font-weight: bold;
                   ">
                    Abrir chamado
                </a>
            </div>

            <p style="margin-top: 30px; font-size: 12px; color: #777777;">
                Esta é uma mensagem automática do Service Desk da NTU.
            </p>
        </div>
    </div>
    """.strip()

    return corpo_texto, corpo_html

def template_status_chamado(
    protocolo: str,
    solicitante_nome: str,
    assunto: str,
    novo_status: str,
    chamado_id: int,
    app_url: str,
) -> tuple[str, str]:
    protocolo = escape(protocolo)
    solicitante_nome = escape(solicitante_nome)
    assunto = escape(assunto)

    status_config = {
        "aguardando_usuario": {
            "titulo": "AÇÃO NECESSÁRIA",
            "status": "Aguardando usuário",
            "mensagem": (
                "A equipe de NTI atualizou seu chamado e está aguardando "
                "uma resposta ou ação sua para continuar o atendimento."
            ),
            "botao": "Responder chamado",
        },
        "resolvido": {
            "titulo": "CHAMADO RESOLVIDO",
            "status": "Resolvido",
            "mensagem": (
                "Seu chamado foi marcado como resolvido pela equipe de NTI. "
                "Acesse o Service Desk para consultar os detalhes da resolução."
            ),
            "botao": "Ver chamado",
        },
        "fechado": {
            "titulo": "CHAMADO FECHADO",
            "status": "Fechado",
            "mensagem": (
                "Seu chamado foi fechado pela equipe de NTI. "
                "O histórico do atendimento permanece disponível no Service Desk."
            ),
            "botao": "Ver chamado",
        },
    }

    configuracao = status_config.get(novo_status)

    if configuracao is None:
        raise ValueError(
            f"Status sem template de notificação: {novo_status}"
        )

    titulo = configuracao["titulo"]
    status_exibicao = configuracao["status"]
    mensagem = configuracao["mensagem"]
    botao = configuracao["botao"]

    url_chamado = f"{app_url.rstrip('/')}/chamados/{chamado_id}"

    corpo_texto = f"""
Olá, {solicitante_nome}.

Houve uma atualização no chamado {protocolo}.

Assunto: {assunto}
Status: {status_exibicao}

{mensagem}

Acesse o Service Desk:
{url_chamado}

Mensagem automática do Service Desk NTU.
Não responda a este e-mail.
""".strip()

    corpo_html = f"""
<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0; padding:0; background:#f4f6f5; font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#f4f6f5; padding:32px 16px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0"
                       style="max-width:600px; width:100%; background:#ffffff;
                              border:1px solid #dce3df; border-radius:8px;">

                    <tr>
                        <td style="background:#18201d; padding:24px 32px;">
                            <div style="color:#ffffff; font-size:22px; font-weight:bold;">
                                Service Desk
                            </div>
                            <div style="color:#aebbb4; font-size:14px; margin-top:4px;">
                                Núcleo de Tecnologia da Informação - NTI
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:32px;">
                            <div style="color:#159455; font-size:13px; font-weight:bold;">
                                {titulo}
                            </div>

                            <h2 style="color:#16201b; margin:8px 0 16px;">
                                {protocolo}
                            </h2>

                            <p style="color:#445049; font-size:14px;">
                                Olá, <strong>{solicitante_nome}</strong>.
                            </p>

                            <p style="color:#445049; font-size:14px; line-height:1.5;">
                                {mensagem}
                            </p>

                            <table width="100%" cellpadding="8" cellspacing="0"
                                   style="font-size:14px; color:#445049; margin:20px 0;">
                                <tr>
                                    <td><strong>Assunto</strong></td>
                                    <td>{assunto}</td>
                                </tr>
                                <tr>
                                    <td><strong>Status</strong></td>
                                    <td>{status_exibicao}</td>
                                </tr>
                            </table>

                            <table cellpadding="0" cellspacing="0" style="margin-top:28px;">
                                <tr>
                                    <td style="background:#159455; border-radius:6px;">
                                        <a href="{url_chamado}"
                                           style="display:inline-block; padding:12px 20px;
                                                  color:#ffffff; text-decoration:none;
                                                  font-size:14px; font-weight:bold;">
                                            {botao}
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="border-top:1px solid #dce3df; padding:18px 32px;
                                   color:#7a857f; font-size:12px;">
                            Mensagem automática do Service Desk NTU.
                            Não responda a este e-mail.
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
""".strip()

    return corpo_texto, corpo_html