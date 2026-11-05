import { Link } from "react-router-dom";
import { Clock3 } from "lucide-react";

export default function AssinaturaExpirada() {
    return (
        <div className="assinatura-retorno">
            <div className="assinatura-retorno-card">
                <div className="assinatura-retorno-icone assinatura-retorno-icone-atencao">
                    <Clock3 size={34} />
                </div>

                <h1>Checkout expirado</h1>

                <p>
                    O prazo para concluir o pagamento terminou.
                    Você pode gerar um novo checkout.
                </p>

                <Link
                    to="/assinatura"
                    className="assinatura-cta"
                >
                    Tentar novamente
                </Link>
            </div>
        </div>
    );
}
