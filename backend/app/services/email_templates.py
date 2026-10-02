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