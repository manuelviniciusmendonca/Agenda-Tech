import { Link } from "react-router-dom";

import LegalLayout from "../legal/LegalLayout";
import {
    DADOS_EMPRESA,
    VERSAO_LEGAL,
} from "../legal/dadosEmpresa";

export default function Termos() {
    return (
        <LegalLayout
            titulo="Termos de Uso"
            descricao="Estas regras formam o contrato entre você e o Agenda Tech para uso da plataforma de gestão de agendamentos."
        >
            <p className="legal-lead">
                Ao criar uma conta, contratar o plano ou utilizar qualquer
                funcionalidade do Agenda Tech, você declara que leu, entendeu e
                concorda integralmente com estes Termos de Uso e com a{" "}
                <Link to="/privacidade">Política de Privacidade</Link>. Se não
                concordar, não utilize a plataforma.
            </p>

            <h2>1. Quem somos</h2>

            <p>
                O Agenda Tech é uma plataforma de software como serviço (SaaS)
                para gestão de agendamentos, clientes, profissionais e
                comunicação com clientes finais, operada por{" "}
                <strong>{DADOS_EMPRESA.razaoSocial}</strong>, inscrita no CNPJ
                sob o nº <strong>{DADOS_EMPRESA.cnpj}</strong>, com sede em{" "}
                {DADOS_EMPRESA.endereco}, {DADOS_EMPRESA.cidadeUf}{" "}
                (“Agenda Tech”, “nós”).
            </p>

            <h2>2. Definições</h2>

            <ul>
                <li>
                    <strong>Plataforma:</strong> o sistema Agenda Tech,
                    disponibilizado pela internet, incluindo painel
                    administrativo, página pública de agendamento e integrações.
                </li>
                <li>
                    <strong>Contratante:</strong> a pessoa jurídica ou o
                    profissional autônomo que cria a conta e contrata o plano.
                </li>
                <li>
                    <strong>Usuário:</strong> qualquer pessoa autorizada pelo
                    Contratante a acessar a conta, incluindo administradores e
                    profissionais.
                </li>
                <li>
                    <strong>Cliente final:</strong> a pessoa que utiliza a página
                    pública para agendar um atendimento junto ao Contratante.
                </li>
                <li>
                    <strong>Assinatura:</strong> a contratação mensal e
                    recorrente do plano Agenda Tech.
                </li>
            </ul>

            <h2>3. Objeto</h2>

            <p>
                3.1. Estes Termos têm por objeto a licença de uso, em caráter
                não exclusivo, intransferível e revogável, da Plataforma, nos
                limites do plano contratado.
            </p>

            <p>
                3.2. A Plataforma é fornecida no modelo de software como serviço,
                hospedado em infraestrutura própria ou de terceiros. Não há
                transferência de propriedade do software, do código-fonte ou de
                qualquer tecnologia.
            </p>

            <p>
                3.3. A Plataforma pode depender de serviços de terceiros, como
                gateways de pagamento e provedores de e-mail, cuja
                indisponibilidade não é de responsabilidade do Agenda Tech,
                observado o dever de mitigação previsto nestes Termos.
            </p>

            <h2>4. Cadastro, conta e credenciais</h2>

            <p>
                4.1. Para usar a Plataforma é necessário criar uma conta com
                informações verdadeiras, completas e atualizadas, incluindo
                dados da empresa e do administrador responsável.
            </p>

            <p>
                4.2. O Contratante declara ser maior de 18 anos, plenamente
                capaz e possuir poderes para representar a empresa cadastrada.
            </p>

            <p>
                4.3. As credenciais de acesso são pessoais e intransferíveis. O
                Contratante é responsável por manter a confidencialidade da
                senha e por todas as atividades realizadas na conta, devendo
                comunicar imediatamente qualquer uso não autorizado.
            </p>

            <p>
                4.4. O Contratante responde pelas informações inseridas na
                Plataforma e pela conduta dos Usuários que convidar,
                especialmente em relação ao tratamento de dados de clientes
                finais.
            </p>

            <h2>5. Perfis de acesso</h2>

            <p>
                5.1. O perfil <strong>Administrador</strong> gerencia a empresa,
                a assinatura, os profissionais, os serviços e as configurações
                gerais.
            </p>

            <p>
                5.2. O perfil <strong>Profissional</strong> acessa apenas as
                funcionalidades necessárias à sua atuação, conforme as
                permissões concedidas pelo Administrador.
            </p>

            <p>
                5.3. O Contratante é o único responsável por definir, revisar e
                revogar os acessos dos Usuários que convidar.
            </p>

            <h2>6. Plano, preço e pagamento</h2>

            <p>
                6.1. O plano disponível é o <strong>Plano Agenda Tech</strong>,
                no valor de <strong>R$ 45,00 (quarenta e cinco reais) por
                mês</strong>, cobrado de forma recorrente.
            </p>

            <p>
                6.2. O pagamento é processado pelo Asaas, exclusivamente por{" "}
                <strong>cartão de crédito</strong>. O Agenda Tech não armazena
                os dados completos do cartão; eles são tratados diretamente pelo
                gateway de pagamento.
            </p>

            <p>
                6.3. A contratação é mensal e a renovação é{" "}
                <strong>automática</strong>: o valor é cobrado a cada ciclo até
                que a assinatura seja cancelada.
            </p>

            <p>
                6.4. O acesso à Plataforma é liberado após a confirmação do
                pagamento pelo gateway. Novas contas não possuem período de
                teste gratuito.
            </p>

            <p>
                6.5. O não pagamento na data de vencimento pode acarretar
                suspensão do acesso e, após o prazo de tolerância informado no
                painel, cancelamento da assinatura.
            </p>

            <p>
                6.6. Eventuais alterações de preço serão comunicadas com
                antecedência mínima de <strong>30 (trinta) dias</strong> por
                e-mail ou aviso no painel, aplicando-se ao ciclo seguinte. O
                Contratante poderá cancelar antes da vigência do novo valor.
            </p>

            <h2>7. Cancelamento</h2>

            <p>
                7.1. O Contratante pode solicitar o cancelamento a qualquer
                momento, sem multa, pelos canais indicados na{" "}
                <Link to="/cancelamento">
                    Política de Cancelamento e Reembolso
                </Link>
                .
            </p>

            <p>
                7.2. O cancelamento encerra as cobranças futuras. O acesso
                permanece disponível até o fim do período já pago, salvo
                hipóteses de rescisão imediata por violação destes Termos.
            </p>

            <p>
                7.3. O direito de arrependimento e as hipóteses de reembolso
                estão descritos na{" "}
                <Link to="/cancelamento">
                    Política de Cancelamento e Reembolso
                </Link>
                .
            </p>

            <h2>8. Uso aceitável</h2>

            <p>O Contratante e os Usuários não podem:</p>

            <ul>
                <li>
                    utilizar a Plataforma para atividades ilícitas, fraudulentas
                    ou que violem direitos de terceiros;
                </li>
                <li>
                    enviar mensagens não solicitadas, spam ou comunicações que
                    violem a legislação aplicável, inclusive o CDC e a LGPD;
                </li>
                <li>
                    copiar, modificar, vender, sublicenciar, alugar ou explorar
                    comercialmente a Plataforma sem autorização escrita;
                </li>
                <li>
                    realizar engenharia reversa, tentar obter o código-fonte ou
                    contornar mecanismos de segurança e autenticação;
                </li>
                <li>
                    inserir código malicioso, realizar ataques, varreduras ou
                    sobrecarregar a infraestrutura;
                </li>
                <li>
                    acessar dados de outras empresas ou de outros Usuários sem
                    autorização;
                </li>
                <li>
                    usar a Plataforma para guardar conteúdo ilegal, ofensivo,
                    discriminatório ou que viole a privacidade de terceiros.
                </li>
            </ul>

            <p>
                O descumprimento autoriza a suspensão imediata do acesso, sem
                prejuízo das medidas cabíveis.
            </p>

            <h2>9. Dados dos clientes finais</h2>

            <p>
                9.1. Os dados de clientes finais inseridos na Plataforma
                pertencem ao Contratante. O Agenda Tech os trata na qualidade de{" "}
                <strong>operador</strong>, exclusivamente para prestar o serviço
                contratado e conforme as instruções do Contratante.
            </p>

            <p>
                9.2. O Contratante, na qualidade de <strong>controlador</strong>,
                é responsável por possuir base legal para o tratamento, por
                informar seus clientes e por atender às solicitações desses
                titulares.
            </p>

            <p>
                9.3. O Contratante obriga-se a não inserir dados sensíveis ou de
                crianças e adolescentes sem base legal específica e sem as
                salvaguardas exigidas pela LGPD.
            </p>

            <h2>10. Propriedade intelectual</h2>

            <p>
                10.1. A Plataforma, sua marca, layout, código, documentação e
                demais elementos são de titularidade do Agenda Tech ou de seus
                licenciantes, protegidos pela Lei de Propriedade Industrial e
                pela Lei de Direitos Autorais.
            </p>

            <p>
                10.2. O Contratante mantém a titularidade dos dados e conteúdos
                que inserir, concedendo ao Agenda Tech licença limitada para
                armazená-los e processá-los com a finalidade de prestar o
                serviço.
            </p>

            <h2>11. Disponibilidade, suporte e manutenção</h2>

            <p>
                11.1. O Agenda Tech envidará esforços comercialmente razoáveis
                para manter a Plataforma disponível, podendo haver interrupções
                programadas para manutenção, atualizações e correções.
            </p>

            <p>
                11.2. Não há garantia de disponibilidade ininterrupta ou de SLA
                específico, salvo acordo escrito em contrário.
            </p>

            <p>
                11.3. O suporte é prestado pelos canais informados no painel e
                no site, em dias úteis, no horário comercial.
            </p>

            <h2>12. Suspensão e rescisão</h2>

            <p>O acesso poderá ser suspenso ou encerrado, sem prejuízo de outras medidas, em caso de:</p>

            <ul>
                <li>inadimplência, após o prazo de tolerância;</li>
                <li>violação destes Termos ou da legislação aplicável;</li>
                <li>uso fraudulento, abusivo ou que comprometa a segurança;</li>
                <li>
                    determinação judicial ou de autoridade competente;
                    ou
                </li>
                <li>descontinuação do serviço, com aviso prévio razoável.</li>
            </ul>

            <p>
                Encerrada a conta, os dados poderão ser eliminados após os prazos
                de guarda legal descritos na{" "}
                <Link to="/privacidade">Política de Privacidade</Link>.
            </p>

            <h2>13. Limitação de responsabilidade</h2>

            <p>
                13.1. O Agenda Tech não se responsabiliza por decisões
                comerciais, perdas de lucro, perda de oportunidade ou danos
                indiretos decorrentes do uso ou da indisponibilidade da
                Plataforma.
            </p>

            <p>
                13.2. A responsabilidade do Agenda Tech, quando cabível, limita-se
                ao valor efetivamente pago pelo Contratante nos 12 (doze) meses
                anteriores ao evento.
            </p>

            <p>
                13.3. As limitações não afastam direitos indisponíveis do
                consumidor previstos no Código de Defesa do Consumidor, quando
                aplicável.
            </p>

            <p>
                13.4. O Contratante é responsável pelo conteúdo das comunicações
                enviadas aos seus clientes finais e pelo cumprimento das regras
                de proteção de dados e de consumo.
            </p>

            <h2>14. Alterações destes Termos</h2>

            <p>
                14.1. Estes Termos podem ser atualizados para refletir mudanças
                legais, técnicas ou comerciais. A versão vigente estará sempre
                disponível nesta página, com data de atualização.
            </p>

            <p>
                14.2. Alterações relevantes serão comunicadas com antecedência
                razoável. O uso da Plataforma após a vigência implica aceitação
                da nova versão.
            </p>

            <h2>15. Privacidade e proteção de dados</h2>

            <p>
                O tratamento de dados pessoais é descrito na{" "}
                <Link to="/privacidade">Política de Privacidade</Link> e na{" "}
                <Link to="/cookies">Política de Cookies</Link>, que integram
                estes Termos para todos os fins.
            </p>

            <h2>16. Comunicações</h2>

            <p>
                O Contratante autoriza o envio de comunicações operacionais,
                avisos de cobrança, segurança e atualizações do serviço para o
                e-mail cadastrado. Comunicações de marketing poderão ser
                enviadas com possibilidade de descadastro.
            </p>

            <h2>17. Legislação e foro</h2>

            <p>
                17.1. Estes Termos são regidos pelas leis brasileiras, em
                especial o Código Civil, o Código de Defesa do Consumidor, o
                Marco Civil da Internet e a LGPD.
            </p>

            <p>
                17.2. Fica eleito o foro de {DADOS_EMPRESA.foro} para dirimir
                controvérsias, ressalvada a competência do domicílio do
                consumidor quando aplicável.
            </p>

            <h2>18. Contato</h2>

            <p>
                Dúvidas sobre estes Termos podem ser enviadas para{" "}
                {DADOS_EMPRESA.emailContato} ou para o suporte em{" "}
                {DADOS_EMPRESA.emailSuporte}.
            </p>

            <p className="legal-note">
                Versão {VERSAO_LEGAL}. Ao marcar a caixa de aceite no cadastro,
                você registra sua concordância com este documento, com a
                Política de Privacidade e com a Política de Cookies.
            </p>
        </LegalLayout>
    );
}
