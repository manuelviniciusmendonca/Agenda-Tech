import { Link } from "react-router-dom";

import LegalLayout from "../legal/LegalLayout";
import { DADOS_EMPRESA } from "../legal/dadosEmpresa";

export default function Cookies() {
    return (
        <LegalLayout
            titulo="Política de Cookies"
            descricao="O que o Agenda Tech armazena no seu navegador, para que serve e como você pode controlar."
        >
            <p className="legal-lead">
                Esta Política complementa a{" "}
                <Link to="/privacidade">Política de Privacidade</Link> e explica
                o uso de cookies e de tecnologias de armazenamento local pelo
                Agenda Tech.
            </p>

            <h2>1. O que são cookies e armazenamento local</h2>

            <p>
                Cookies são pequenos arquivos gravados no navegador por um site.
                O armazenamento local (localStorage e sessionStorage) funciona de
                forma semelhante, mas mantém os dados no próprio navegador sem
                enviá-los automaticamente a cada requisição.
            </p>

            <h2>2. O que utilizamos</h2>

            <p>
                O Agenda Tech utiliza apenas recursos <strong>essenciais</strong>{" "}
                ao funcionamento do serviço. Não utilizamos cookies de
                publicidade, de perfilamento comportamental ou de redes sociais.
            </p>

            <div className="legal-table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Nome / tipo</th>
                            <th>Finalidade</th>
                            <th>Duração</th>
                            <th>Categoria</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr>
                            <td>
                                <code>token</code> (localStorage)
                            </td>
                            <td>
                                Manter a sessão autenticada do usuário no painel.
                            </td>
                            <td>Até 7 dias ou até o logout</td>
                            <td>Essencial</td>
                        </tr>

                        <tr>
                            <td>Preferências de interface (localStorage)</td>
                            <td>
                                Lembrar escolhas simples de uso, quando
                                existirem.
                            </td>
                            <td>Até serem apagadas</td>
                            <td>Funcional</td>
                        </tr>

                        <tr>
                            <td>Registros de segurança no servidor</td>
                            <td>
                                Identificar abusos, limitar tentativas de acesso
                                e manter registros de acesso.
                            </td>
                            <td>Conforme prazos legais</td>
                            <td>Essencial</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <p>
                Não utilizamos Google Analytics, pixels de redes sociais ou
                qualquer ferramenta de rastreamento de terceiros nesta versão da
                Plataforma.
            </p>

            <h2>3. Base legal</h2>

            <p>
                Os recursos essenciais são tratados com base na execução de
                contrato (art. 7º, V, da LGPD), pois sem eles a autenticação e a
                segurança do serviço não funcionam. Recursos funcionais, quando
                existirem, apoiam-se no legítimo interesse ou no consentimento,
                conforme o caso.
            </p>

            <h2>4. Como controlar</h2>

            <p>
                Você pode apagar cookies e dados de armazenamento local nas
                configurações do seu navegador. Também pode navegar em modo
                privado.
            </p>

            <p>
                <strong>Atenção:</strong> apagar o armazenamento local remove o
                token de sessão e faz você sair da conta. O Agenda Tech não
                consegue restaurar esse dado, pois ele fica apenas no seu
                navegador.
            </p>

            <p>
                Instruções dos navegadores mais usados:
            </p>

            <ul>
                <li>Chrome: Configurações → Privacidade e segurança → Cookies;</li>
                <li>Firefox: Configurações → Privacidade e segurança;</li>
                <li>Edge: Configurações → Cookies e permissões do site;</li>
                <li>Safari: Preferências → Privacidade.</li>
            </ul>

            <h2>5. Alterações</h2>

            <p>
                Se passarmos a usar novas categorias de cookies, esta Política
                será atualizada e, quando a lei exigir, solicitaremos seu
                consentimento antes da ativação.
            </p>

            <h2>6. Contato</h2>

            <p>
                Dúvidas sobre esta Política:{" "}
                <strong>{DADOS_EMPRESA.emailPrivacidade}</strong>.
            </p>
        </LegalLayout>
    );
}
