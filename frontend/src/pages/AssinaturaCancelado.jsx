import { Link } from "react-router-dom";
import { XCircle } from "lucide-react";

export default function AssinaturaCancelado() {
    return (
        <div className="assinatura-retorno">
            <div className="assinatura-retorno-card">
                <div className="assinatura-retorno-icone assinatura-retorno-icone-erro">
                    <XCircle size={34} />
                </div>

                <h1>Pagamento cancelado</h1>

                <p>
                    O processo de pagamento foi cancelado.
                    Você pode tentar novamente quando quiser.
                </p>

                <Link
                    to="/assinatura"
                    className="assinatura-cta"
                >
                    Voltar para assinatura
                </Link>
            </div>
        </div>
    );
}
