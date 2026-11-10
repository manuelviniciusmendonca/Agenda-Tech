import { Link } from "react-router-dom";

import LegalLayout from "../legal/LegalLayout";
import { DADOS_EMPRESA } from "../legal/dadosEmpresa";

export default function Privacidade() {
    return (
        <LegalLayout
            titulo="Política de Privacidade"
            descricao="Como o Agenda Tech coleta, usa, armazena e protege dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD)."
        >
            <p className="legal-lead">
                Esta Política explica o tratamento de dados pessoais realizado
                pelo Agenda Tech, nos termos da Lei nº 13.709/2018 (LGPD) e das
                demais normas aplicáveis. Ela se aplica a visitantes do site,
                Contratantes, Usuários e clientes finais que utilizam a página
                pública de agendamento.
            </p>

            <h2>1. Controlador</h2>

            <p>
                O controlador dos dados pessoais tratados na Plataforma é{" "}
                <strong>{DADOS_EMPRESA.razaoSocial}</strong>, CNPJ{" "}
                <strong>{DADOS_EMPRESA.cnpj}</strong>, com sede em{" "}
                {DADOS_EMPRESA.endereco}, {DADOS_EMPRESA.cidadeUf}.
            </p>

            <p>
                <strong>Encarregado pelo Tratamento de Dados (DPO):</strong>{" "}
                {DADOS_EMPRESA.emailPrivacidade}
            </p>

            <h2>2. Papéis: controlador e operador</h2>

            <p>
                2.1. Em relação aos dados de cadastro, cobrança, navegação e
                segurança, o Agenda Tech atua como <strong>controlador</strong>.
            </p>

            <p>
                2.2. Em relação aos dados de clientes finais e agendamentos
                inseridos pelo Contratante, o Agenda Tech atua como{" "}
                <strong>operador</strong>, tratando os dados apenas conforme as
                instruções do Contratante, que é o controlador desses dados.
            </p>

            <p>
                2.3. O cliente final deve procurar o estabelecimento com o qual
                agendou para exercer direitos sobre os dados do agendamento. O
                Agenda Tech auxilia o Contratante no atendimento dessas
                solicitações.
            </p>

            <h2>3. Dados que coletamos</h2>

            <h3>3.1. Dados de cadastro e identificação</h3>

            <ul>
                <li>nome do administrador e nome da empresa;</li>
                <li>e-mail, telefone e identificador da página (slug);</li>
                <li>
                    senha, armazenada apenas em formato de hash criptográfico;
                </li>
                <li>perfil de acesso (administrador ou profissional).</li>
            </ul>

            <h3>3.2. Dados operacionais inseridos no uso da Plataforma</h3>

            <ul>
                <li>clientes do Contratante: nome, telefone, e-mail e observações;</li>
                <li>serviços, profissionais, horários e agendamentos;</li>
                <li>
                    registros de acesso, endereço IP, data e hora e agente do
                    navegador;
                </li>
                <li>registros de aceite dos documentos legais.</li>
            </ul>

            <h3>3.3. Dados de pagamento</h3>

            <p>
                Os dados de cartão de crédito são coletados e processados
                diretamente pelo Asaas. O Agenda Tech não armazena o número
                completo do cartão nem o código de segurança. Recebemos apenas
                informações sobre o status da cobrança, identificadores da
                assinatura e dados cadastrais necessários à emissão de cobrança.
            </p>

            <h3>3.4. Dados de navegação</h3>

            <p>
                Utilizamos armazenamento local do navegador para manter a sessão
                autenticada. Não utilizamos cookies de publicidade ou de
                rastreamento de terceiros. Detalhes na{" "}
                <Link to="/cookies">Política de Cookies</Link>.
            </p>

            <h2>4. Finalidades e bases legais</h2>

            <div className="legal-table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Finalidade</th>
                            <th>Base legal (LGPD)</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr>
                            <td>
                                Criar e manter a conta, autenticar o acesso e
                                prestar o serviço contratado.
                            </td>
                            <td>Execução de contrato (art. 7º, V)</td>
                        </tr>

                        <tr>
                            <td>
                                Processar pagamentos, emitir cobranças e
                                controlar a assinatura.
                            </td>
                            <td>
                                Execução de contrato e obrigação legal
                                (art. 7º, II e V)
                            </td>
                        </tr>

                        <tr>
                            <td>
                                Enviar avisos operacionais, de segurança e de
                                cobrança.
                            </td>
                            <td>
                                Execução de contrato e legítimo interesse
                                (art. 7º, V e IX)
                            </td>
                        </tr>

                        <tr>
                            <td>
                                Prevenir fraudes, abusos e incidentes de
                                segurança; manter registros de acesso.
                            </td>
                            <td>
                                Legítimo interesse e obrigação legal
                                (art. 7º, II e IX)
                            </td>
                        </tr>

                        <tr>
                            <td>
                                Atender solicitações de titulares e autoridades
                                competentes.
                            </td>
                            <td>
                                Obrigação legal e exercício regular de direitos
                                (art. 7º, II e VI)
                            </td>
                        </tr>

                        <tr>
                            <td>
                                Enviar comunicações de marketing sobre o produto.
                            </td>
                            <td>
                                Consentimento (art. 7º, I), com descadastro
                                disponível
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h2>5. Compartilhamento de dados</h2>

            <p>
                Não vendemos dados pessoais. O compartilhamento ocorre apenas com
                operadores e parceiros necessários à prestação do serviço, sempre
                limitado à finalidade específica:
            </p>

            <ul>
                <li>
                    <strong>Asaas</strong> — processamento de pagamentos e
                    gestão da assinatura;
                </li>
                <li>
                    <strong>provedor de e-mail</strong> — envio de mensagens
                    transacionais, como recuperação de senha;
                </li>
                <li>
                    <strong>provedor de infraestrutura</strong> — hospedagem do
                    banco de dados e da aplicação;
                </li>
                <li>
                    <strong>autoridades públicas</strong> — quando houver
                    requisição legal, judicial ou administrativa.
                </li>
            </ul>

            <p>
                Todos os operadores são contratados com obrigações de
                confidencialidade e de proteção de dados compatíveis com a LGPD.
            </p>

            <h2>6. Transferência internacional</h2>

            <p>
                Alguns provedores de infraestrutura ou de serviços podem
                processar dados fora do Brasil. Nesses casos, o Agenda Tech adota
                salvaguardas contratuais e verifica se o país de destino oferece
                grau de proteção adequado ou se há cláusulas-padrão que atendam
                ao art. 33 da LGPD.
            </p>

            <h2>7. Retenção e eliminação</h2>

            <p>
                7.1. Os dados são mantidos enquanto a conta estiver ativa e pelo
                tempo necessário ao cumprimento das finalidades desta Política.
            </p>

            <p>7.2. Após o encerramento da conta, os dados poderão ser mantidos:</p>

            <ul>
                <li>
                    por até <strong>5 (cinco) anos</strong>, para cumprimento de
                    obrigações fiscais, contábeis e de defesa em processos;
                </li>
                <li>
                    por, no mínimo, <strong>6 (seis) meses</strong>, para os
                    registros de acesso a aplicações, conforme o art. 15 do
                    Marco Civil da Internet;
                </li>
                <li>
                    pelo prazo legal específico, quando houver outra exigência
                    normativa.
                </li>
            </ul>

            <p>
                7.3. Encerrados os prazos, os dados são eliminados ou
                anonimizados de forma segura.
            </p>

            <h2>8. Segurança da informação</h2>

            <p>
                Adotamos medidas técnicas e administrativas para proteger os
                dados, incluindo:
            </p>

            <ul>
                <li>senhas armazenadas com hash criptográfico (bcrypt);</li>
                <li>autenticação por token JWT com tempo de expiração;</li>
                <li>comunicação criptografada por HTTPS;</li>
                <li>controle de acesso por perfil e por empresa;</li>
                <li>limitação de tentativas de acesso e de requisições;</li>
                <li>backups periódicos e restrição de acesso ao banco de dados.</li>
            </ul>

            <p>
                Nenhum sistema é completamente imune a incidentes. Em caso de
                incidente relevante, o Agenda Tech comunicará os titulares e a
                Autoridade Nacional de Proteção de Dados (ANPD) nos prazos
                legais.
            </p>

            <h2>9. Direitos do titular</h2>

            <p>
                Nos termos do art. 18 da LGPD, o titular pode solicitar, a
                qualquer momento:
            </p>

            <ul>
                <li>confirmação da existência de tratamento;</li>
                <li>acesso aos dados;</li>
                <li>correção de dados incompletos, inexatos ou desatualizados;</li>
                <li>
                    anonimização, bloqueio ou eliminação de dados desnecessários,
                    excessivos ou tratados em desconformidade;
                </li>
                <li>portabilidade, observados os segredos comercial e industrial;</li>
                <li>
                    eliminação dos dados tratados com consentimento, ressalvadas
                    as hipóteses de guarda legal;
                </li>
                <li>
                    informação sobre entidades com as quais os dados foram
                    compartilhados;
                </li>
                <li>
                    informação sobre a possibilidade de não fornecer
                    consentimento e as consequências;
                </li>
                <li>revogação do consentimento.</li>
            </ul>

            <p>
                As solicitações devem ser enviadas para{" "}
                <strong>{DADOS_EMPRESA.emailPrivacidade}</strong>. Responderemos
                em até 15 (quinze) dias, prorrogáveis mediante justificativa.
                Poderemos solicitar informações adicionais para confirmar a
                identidade do solicitante e evitar acessos indevidos.
            </p>

            <p>
                Se o pedido se referir a dados de cliente final de um
                estabelecimento, o titular será direcionado ao respectivo
                Contratante, ou o Agenda Tech solicitará sua autorização para
                atender o pedido.
            </p>

            <h2>10. Dados de clientes finais tratados pelo Contratante</h2>

            <p>
                10.1. O Contratante é o controlador dos dados de seus clientes
                finais e deve garantir base legal para o tratamento, informar os
                titulares e manter os dados atualizados.
            </p>

            <p>
                10.2. O Agenda Tech trata esses dados apenas para viabilizar a
                funcionalidade contratada: cadastro de clientes, agendamentos,
                lembretes e comunicações realizadas pelo próprio Contratante.
            </p>

            <p>
                10.3. O Contratante não deve inserir dados sensíveis ou de
                crianças e adolescentes sem base legal específica.
            </p>

            <h2>11. Incidentes de segurança</h2>

            <p>
                Em caso de incidente que possa acarretar risco relevante aos
                titulares, o Agenda Tech adotará medidas de contenção, investigará
                as causas, comunicará os afetados e a ANPD quando exigido, e
                registrará o ocorrido para fins de prestação de contas.
            </p>

            <h2>12. Crianças e adolescentes</h2>

            <p>
                A Plataforma é destinada a empresas e profissionais maiores de 18
                anos. Não coletamos intencionalmente dados de crianças e
                adolescentes. Caso isso ocorra por inserção do Contratante, ele
                deverá observar o art. 14 da LGPD e obter consentimento
                específico do responsável legal.
            </p>

            <h2>13. Alterações desta Política</h2>

            <p>
                Esta Política pode ser atualizada para refletir mudanças legais,
                técnicas ou operacionais. A versão vigente estará sempre
                disponível nesta página, com data de atualização. Alterações
                relevantes serão comunicadas pelos canais oficiais.
            </p>

            <h2>14. Contato</h2>

            <p>
                Para exercer direitos, tirar dúvidas ou relatar incidentes:{" "}
                <strong>{DADOS_EMPRESA.emailPrivacidade}</strong>.
            </p>

            <p>
                Você também pode apresentar reclamação à Autoridade Nacional de
                Proteção de Dados (ANPD), pelo site gov.br/anpd.
            </p>
        </LegalLayout>
    );
}
