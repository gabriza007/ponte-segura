const { useState, useEffect } = React;

function App() {
    // idle -> confirm -> sending -> success
    const [status, setStatus] = useState('idle');

    const handleInitialClick = () => {
        setStatus('confirm'); // Primeiro toque
    };

    const handleConfirmClick = () => {
        setStatus('sending'); // Confirmação (Segundo toque)

        console.log("Iniciando envio real do Alerta para o Banco de Dados (Django)...");
        fetch('http://127.0.0.1:8000/api/alerta/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ localizacao: 'Ponte Princesa Isabel (Detectado via Celular)' })
        })
            .then(response => response.json())
            .then(data => {
                if (data.sucesso) {
                    console.log("SUCESSO: Alerta salvo no banco PostgreSQL!", data);
                    setStatus('success');
                } else {
                    console.error("Erro retornado pelo servidor:", data.erro);
                    alert("Falha: " + data.erro);
                    setStatus('idle');
                }
            })
            .catch(error => {
                console.error("Erro de rede:", error);
                alert("Erro de conexão! O servidor (python manage.py runserver) está rodando?");
                setStatus('idle');
            });
    };

    const handleCancel = () => {
        setStatus('idle');
    };

    if (status === 'success') {
        return (
            <div className="success-screen">
                <h2>Ocorrência Registrada</h2>
                <p>A Guarda Municipal já foi acionada e tem a sua localização exata.</p>
                <button className="btn-secondary" onClick={handleCancel}>
                    Retornar ao Início
                </button>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="header">
                <h1>🛡️ PONTE SEGURA</h1>
            </div>
            <div className="content">
                <p style={{ marginBottom: '40px', color: '#cbd5e1', fontSize: '18px', padding: '0 20px' }}>
                    {status === 'idle' ? 'Em caso de emergência, pressione o botão abaixo para pedir ajuda.' : 'ATENÇÃO: Deseja realmente enviar a sua localização para a patrulha?'}
                </p>

                <button
                    className={`panic-button ${status}`}
                    onClick={status === 'idle' ? handleInitialClick : handleConfirmClick}
                    disabled={status === 'sending'}
                >
                    {status === 'idle' && (
                        <React.Fragment>
                            <span style={{ fontSize: '45px' }}>🚨</span>
                            <span>PEDIR AJUDA</span>
                        </React.Fragment>
                    )}
                    {status === 'confirm' && (
                        <React.Fragment>
                            <span style={{ fontSize: '30px' }}>⚠️</span>
                            <span>CONFIRMAR AGORA</span>
                        </React.Fragment>
                    )}
                    {status === 'sending' && (
                        <span>Enviando...</span>
                    )}
                </button>

                {status === 'confirm' && (
                    <button className="cancel-btn" onClick={handleCancel}>
                        Cancelar Solicitação
                    </button>
                )}
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
