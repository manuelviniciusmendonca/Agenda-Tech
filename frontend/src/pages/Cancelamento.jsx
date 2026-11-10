import { Link } from "react-router-dom";

import LegalLayout from "../legal/LegalLayout";
import { DADOS_EMPRESA } from "../legal/dadosEmpresa";

export default function Cancelamento() {
    return (
        <LegalLayout
            titulo="Cancelamento e Reembolso"
            descricao="Regras para cancelar a assinatura do Agenda Tech e para solicitar reembolso, incluindo o direito de arrependimento previsto no Código de Defesa do Consumidor."
        >
            <p className="legal-lead">
                Esta Política integra os{" "}
                <Link to="/termos">Termos de Uso</Link> e se aplica à assinatura
                mensal do Plano Agenda Tech, no valor de R$ 45,00 por mês.
            </p>

            <h2>1. Como funciona a assinatura</h2>

            <p>
                1.1. A assinatura é <strong>mensal e recorrente</strong>. Após a
                confirmação do primeiro pagamento, o acesso é liberado e novas
                cobranças ocorrem automaticamente a cada ciclo mensal, até o
                cancelamento.
            </p>

            <p>
                1.2. A cobrança é feita no cartão de crédito informado no
                checkout do Asaas. O Agenda Tech não armazena os dados completos
                do cartão.
            </p>

            <h2>2. Como cancelar</h2>

            <p>
                2.1. O cancelamento pode ser solicitado a qualquer momento, sem
                multa, por um destes canais:
            </p>

            <ul>
                <li>
                    e-mail para <strong>{DADOS_EMPRESA.emailSuporte}</strong>,
                    enviado do e-mail cadastrado na conta;
                </li>
                <li>
                    e-mail para <strong>{DADOS_EMPRESA.emailContato}</strong>.
                </li>
            </ul>

            <p>
                2.2. Para agilizar, informe o nome da empresa e o e-mail do
                administrador. Podemos solicitar confirmação de identidade para
                evitar cancelamentos indevidos.
            </p>

            <p>
                2.3. O cancelamento é processado em até{" "}
                <strong>2 (dois) dias úteis</strong> e interrompe as cobranças
                futuras.
            </p>

            <p>
                2.4. O acesso permanece disponível até o fim do período já pago.
                Não há cobrança de multa nem de taxa de cancelamento.
            </p>

            <p>
                2.5. Se o cancelamento for solicitado antes da próxima renovação,
                nenhuma nova cobrança será feita. Se a cobrança já tiver sido
                processada, aplica-se a regra da seção 3.
            </p>

            <h2>3. Direito de arrependimento (7 dias)</h2>

            <p>
                3.1. Nos termos do <strong>art. 49 do Código de Defesa do
                Consumidor</strong>, quando a contratação ocorrer fora do
                estabelecimento comercial (inclusive pela internet), o
                consumidor pode desistir do contrato no prazo de{" "}
                <strong>7 (sete) dias corridos</strong>, contados da assinatura
                ou do recebimento do serviço, o que ocorrer por último.
            </p>

            <p>
                3.2. Dentro desse prazo, o reembolso é <strong>integral</strong>,
                incluindo o valor da primeira mensalidade, e o cancelamento é
                imediato.
            </p>

            <p>
                3.3. A solicitação deve ser enviada para{" "}
                <strong>{DADOS_EMPRESA.emailSuporte}</strong>, com identificação
                da conta. Não é necessário justificar o motivo.
            </p>

            <p>
                3.4. O reembolso será processado pelo Asaas, preferencialmente
                pela mesma forma de pagamento utilizada. O prazo para o valor
                aparecer na fatura depende do emissor do cartão e pode levar até{" "}
                <strong>2 (duas) faturas</strong>.
            </p>

            <h2>4. Reembolso fora do prazo de arrependimento</h2>

            <p>
                4.1. Após os 7 dias, a mensalidade já iniciada não é reembolsável
                de forma proporcional, pois o serviço permanece disponível
                durante todo o ciclo contratado.
            </p>

            <p>4.2. Ainda assim, haverá reembolso integral ou parcial quando:</p>

            <ul>
                <li>houver cobrança em duplicidade;</li>
                <li>houver cobrança após o cancelamento solicitado;</li>
                <li>
                    o serviço ficar indisponível por falha comprovada do Agenda
                    Tech por período relevante, sem solução em prazo razoável;
                </li>
                <li>houver erro comprovado na cobrança;</li>
                <li>a lei ou decisão judicial assim determinar.</li>
            </ul>

            <p>
                4.3. Nesses casos, a análise é feita em até{" "}
                <strong>5 (cinco) dias úteis</strong> após o recebimento da
                solicitação, com resposta pelos canais de contato informados.
            </p>

            <h2>5. Inadimplência</h2>

            <p>
                5.1. Se a cobrança não for aprovada, o acesso poderá ser
                suspenso após o prazo de tolerância indicado no painel.
            </p>

            <p>
                5.2. A assinatura poderá ser cancelada se o pagamento não for
                regularizado dentro do prazo informado, sem prejuízo da cobrança
                dos valores devidos e dos encargos previstos.
            </p>

            <p>
                5.3. A regularização dentro do prazo restabelece o acesso
                automaticamente.
            </p>

            <h2>6. Exclusão da conta e dos dados</h2>

            <p>
                6.1. O cancelamento da assinatura não exclui automaticamente a
                conta. Para excluir a conta e os dados, o titular deve solicitar
                pelos canais desta Política.
            </p>

            <p>
                6.2. A exclusão observa os prazos de guarda legal descritos na{" "}
                <Link to="/privacidade">Política de Privacidade</Link>,
                especialmente obrigações fiscais e registros de acesso.
            </p>

            <p>
                6.3. Antes da exclusão, recomendamos exportar as informações de
                que precisar. Após a eliminação, não é possível recuperá-las.
            </p>

            <h2>7. Contato</h2>

            <p>
                Suporte: <strong>{DADOS_EMPRESA.emailSuporte}</strong>
                <br />
                Assuntos gerais: <strong>{DADOS_EMPRESA.emailContato}</strong>
                <br />
                Privacidade e dados pessoais:{" "}
                <strong>{DADOS_EMPRESA.emailPrivacidade}</strong>
            </p>
        </LegalLayout>
    );
}
