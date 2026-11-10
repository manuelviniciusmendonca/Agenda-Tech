import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

import {
    DADOS_EMPRESA,
    DATA_ATUALIZACAO,
    DOCUMENTOS_LEGAIS,
    VERSAO_LEGAL,
    dadosPendentes,
} from "./dadosEmpresa";

export default function LegalLayout({ titulo, descricao, children }) {
    const { pathname } = useLocation();

    return (
        <div className="legal-page">
            <header className="legal-topbar">
                <Link to="/" className="legal-brand">
                    <img
                        src="/logo.png"
                        alt="Agenda Tech"
                        className="legal-brand-logo"
                    />

                    <span className="legal-brand-text">
                        <strong>Agenda Tech</strong>
                        <small>GESTÃO DE AGENDAMENTOS</small>
                    </span>
                </Link>

                <Link to="/" className="legal-back">
                    <ArrowLeft size={16} />
                    Voltar ao sistema
                </Link>
            </header>

            <main className="legal-container">
                <article className="legal-card">
                    <header className="legal-header">
                        <p className="legal-eyebrow">DOCUMENTO LEGAL</p>

                        <h1>{titulo}</h1>

                        {descricao && (
                            <p className="legal-description">{descricao}</p>
                        )}

                        <p className="legal-meta">
                            Versão {VERSAO_LEGAL} · Atualizado em{" "}
                            {DATA_ATUALIZACAO}
                        </p>
                    </header>

                    {dadosPendentes && (
                        <div className="legal-pending" role="note">
                            <strong>Documento em revisão.</strong> Os dados
                            cadastrais da empresa responsável ainda estão sendo
                            preenchidos. Esta página será considerada válida
                            somente após a publicação da versão definitiva.
                        </div>
                    )}

                    <div className="legal-body">{children}</div>

                    <footer className="legal-company">
                        <h2>Identificação da empresa</h2>

                        <dl>
                            <div>
                                <dt>Razão social</dt>
                                <dd>{DADOS_EMPRESA.razaoSocial}</dd>
                            </div>

                            <div>
                                <dt>Nome fantasia</dt>
                                <dd>{DADOS_EMPRESA.nomeFantasia}</dd>
                            </div>

                            <div>
                                <dt>CNPJ</dt>
                                <dd>{DADOS_EMPRESA.cnpj}</dd>
                            </div>

                            <div>
                                <dt>Endereço</dt>
                                <dd>
                                    {DADOS_EMPRESA.endereco} —{" "}
                                    {DADOS_EMPRESA.cidadeUf}
                                </dd>
                            </div>

                            <div>
                                <dt>Contato</dt>
                                <dd>{DADOS_EMPRESA.emailContato}</dd>
                            </div>

                            <div>
                                <dt>Encarregado de dados (DPO)</dt>
                                <dd>{DADOS_EMPRESA.emailPrivacidade}</dd>
                            </div>
                        </dl>
                    </footer>
                </article>

                <nav className="legal-nav" aria-label="Documentos legais">
                    <p className="legal-nav-title">DOCUMENTOS</p>

                    {DOCUMENTOS_LEGAIS.map((documento) => {
                        const ativo =
                            documento.caminho === pathname;

                        return (
                            <Link
                                key={documento.chave}
                                to={documento.caminho}
                                className={
                                    ativo
                                        ? "legal-nav-item legal-nav-item-active"
                                        : "legal-nav-item"
                                }
                                aria-current={ativo ? "page" : undefined}
                            >
                                <span>
                                    <strong>{documento.titulo}</strong>
                                    <small>{documento.descricao}</small>
                                </span>

                                <ArrowUpRight size={15} />
                            </Link>
                        );
                    })}
                </nav>
            </main>

            <footer className="legal-bottom">
                <span>
                    © {new Date().getFullYear()}{" "}
                    {DADOS_EMPRESA.nomeFantasia}. Todos os direitos
                    reservados.
                </span>

                <span>
                    Dúvidas sobre estes documentos?{" "}
                    {DADOS_EMPRESA.emailContato}
                </span>
            </footer>
        </div>
    );
}
