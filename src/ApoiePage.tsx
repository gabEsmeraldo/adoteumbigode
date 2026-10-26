import { useEffect, useState } from "react";
import QRCode from "qrcode";
import logo from "./imports/sticker_logo.png";
import heroImage from "./imports/IMG-20230712-WA0192.jpg";
import { pixKey, pixPayload } from "./pix";

const recurring = [
  {
    tag: "Mensalista de areia",
    title: "Banheiro limpo o mês todo",
    description: "Garanta a areia dos gatinhos acolhidos todos os meses.",
    href: "https://pag.ae/82dEXc1nJ",
    cta: "Quero ser mensalista",
  },
  {
    tag: "Mensalista de sachê",
    title: "Comidinha garantida",
    description: "Sachês para filhotes, idosos e gatinhos em recuperação.",
    href: "https://pag.ae/82bt7YVX9",
    cta: "Quero ser mensalista",
  },
  {
    tag: "Apoia.se",
    title: "Apoio recorrente",
    description: "Contribua mensalmente com o valor que escolher.",
    href: "https://apoia.se/adoteumbigodece",
    cta: "Acessar Apoia.se",
  },
  {
    tag: "Mercado Pago",
    title: "Assinatura mensal",
    description: "Cadastre uma contribuição recorrente com segurança.",
    href: "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=2c9380849817d4a3019819c9df8f00b7",
    cta: "Assinar agora",
  },
];

const stores = [
  { name: "Shopee", href: "https://s.shopee.com.br/801ADDenon" },
  { name: "Amazon", href: "https://amzn.to/3P63wHC" },
  { name: "Cobasi", href: "https://minhaloja.cobasi.com.br/?utm_source=mais&utm_medium=maisplataforma&utm_campaign=adoteumbigode" },
];

const coupons = [
  { name: "Petz", code: "ADOTEUMBIGODE" },
  { name: "Zeenow", code: "ADOTEBIGODE" },
  { name: "Petlove", code: "ADOTEUMBIGODE", href: "https://saude.petlove.com.br/" },
  {
    name: "Pague Menos",
    code: "ADOTEUMBIGODECEARA",
    note: "Código de consultor",
    href: "https://www.paguemenos.com.br/loja?=adoteumbigodeceara",
  },
];

export default function ApoiePage() {
  const [pixQrCode, setPixQrCode] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    QRCode.toDataURL(pixPayload, { margin: 1, width: 448 }).then(setPixQrCode);
  }, []);

  const copy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied((current) => (current === id ? "" : current)), 2000);
  };

  return (
    <main className="min-h-screen bg-[#f7f5ef] text-[#18314a]">
      <header className="sticky top-0 z-40 border-b border-[#18314a]/15 bg-[#f7f5ef]/95 backdrop-blur">
        <div className="page-shell flex h-16 items-center justify-between gap-5 sm:h-20 lg:h-24">
          <a href="/" aria-label="Voltar para a página inicial">
            <img src={logo} alt="Adote um Bigode" className="h-10 w-auto object-contain lg:h-16" />
          </a>
          <a href="/" className="button-secondary !min-h-10 sm:!min-h-12">
            <span aria-hidden="true">←</span> Voltar ao site
          </a>
        </div>
      </header>

      <section className="page-shell grid gap-10 py-12 sm:py-16 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:py-20">
        <div>
          <p className="eyebrow">Apoie o projeto</p>
          <h1 className="mt-4 max-w-3xl text-5xl font-bold leading-[.98] tracking-[-0.045em] sm:text-6xl">
            Sua doação vira{" "}
            <span className="relative whitespace-nowrap text-[#1263a5]">
              ração, areia
              <span className="absolute -bottom-2 left-1 h-2 w-[96%] -rotate-1 rounded-full bg-[#f0b43b]/70" />
            </span>{" "}
            e veterinário.
          </h1>
          <p className="body-copy mt-6 max-w-xl">
            Não temos abrigo nem patrocínio fixo. Cada gatinho resgatado depende
            de quem doa — e quem doa todo mês é o que nos deixa planejar o
            próximo resgate.
          </p>
          <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
            <a href="#pix" className="button-primary">Doar agora por Pix</a>
            <a href="#mensal" className="button-secondary">Doar todo mês</a>
          </div>
        </div>
        <div className="photo-frame aspect-[4/3] rotate-1">
          <img src={heroImage} alt="Doação de alimentos recebida pelo projeto" className="h-full w-full object-cover" />
        </div>
      </section>

      <section id="pix" className="scroll-mt-24 border-y border-[#18314a]/15 bg-[#1263a5] text-white">
        <div className="page-shell grid gap-8 py-14 sm:py-16 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f5c65c]">Doação única · Pix</p>
            <h2 className="mt-3 text-4xl font-bold tracking-[-0.035em] sm:text-5xl">Qualquer valor ajuda.</h2>
            <p className="mt-4 max-w-xl text-white/75">
              Escaneie o QR Code no app do seu banco ou copie o código Pix copia e cola.
            </p>
            <p className="mt-6 text-lg font-bold break-all">{pixKey}</p>
            <button
              type="button"
              onClick={() => copy("pix", pixPayload)}
              className="mt-4 inline-flex min-h-12 items-center justify-center rounded-full bg-[#f5c65c] px-6 text-sm font-bold text-[#18314a] transition-transform hover:-translate-y-0.5"
            >
              {copied === "pix" ? "Código copiado ✓" : "Copiar Pix copia e cola"}
            </button>
          </div>
          <div className="w-fit rounded-2xl border-2 border-[#18314a] bg-[#f7f5ef] p-3 text-center text-[#18314a] shadow-[6px_6px_0_#f5c65c]">
            {pixQrCode && <img src={pixQrCode} alt={`QR Code Pix para a chave ${pixKey}`} className="h-44 w-44 sm:h-52 sm:w-52" />}
            <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.08em]">Escaneie no app do banco</p>
          </div>
        </div>
      </section>

      <section id="mensal" className="scroll-mt-24 bg-[#dcebf5]">
        <div className="page-shell py-16 lg:py-24">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
            <div>
              <p className="eyebrow">Doação recorrente</p>
              <h2 className="section-title mt-4">Seja um mensalista.</h2>
            </div>
            <p className="body-copy max-w-lg lg:justify-self-end">
              Doações mensais são o que mantém a rotina dos lares temporários.
              Escolha o que mais combina com você.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {recurring.map((item, index) => (
              <a
                key={item.tag}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className={`flex flex-col rounded-2xl border-2 border-[#18314a] p-6 transition-transform hover:-translate-y-1 ${
                  index < 2 ? "bg-[#f5c65c] shadow-[5px_5px_0_#18314a]" : "bg-white"
                }`}
              >
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1263a5]">{item.tag}</p>
                <p className="mt-2 text-2xl font-bold tracking-tight">{item.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-[#18314a]/70">{item.description}</p>
                <span className="mt-6 text-sm font-bold">{item.cta} →</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f7f5ef]">
        <div className="page-shell grid gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="eyebrow">Compre e ajude</p>
            <h2 className="mt-4 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">Links de afiliado</h2>
            <p className="body-copy mt-3">Compre pelos nossos links e parte do valor volta para o projeto, sem custo extra.</p>
            <div className="mt-6 grid gap-3">
              {stores.map((store) => (
                <a
                  key={store.name}
                  href={store.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-14 items-center justify-between rounded-xl border border-[#18314a]/20 bg-white px-5 font-bold transition-colors hover:border-[#1263a5] hover:text-[#1263a5]"
                >
                  {store.name} <span aria-hidden="true">→</span>
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="eyebrow">Use nosso cupom</p>
            <h2 className="mt-4 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">Cupons parceiros</h2>
            <p className="body-copy mt-3">Use o cupom na finalização da compra para apoiar o projeto.</p>
            <div className="mt-6 grid gap-3">
              {coupons.map((coupon) => (
                <div key={coupon.name} className="flex items-center justify-between gap-3 rounded-xl border border-[#18314a]/20 bg-white p-4 pl-5">
                  <div className="min-w-0">
                    {coupon.href ? (
                      <a href={coupon.href} target="_blank" rel="noreferrer" className="font-bold hover:text-[#1263a5]">
                        {coupon.name} ↗
                      </a>
                    ) : (
                      <p className="font-bold">{coupon.name}</p>
                    )}
                    <p className="mt-0.5 truncate font-mono text-xs text-[#18314a]/60">
                      {coupon.note ? `${coupon.note}: ` : ""}{coupon.code}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copy(coupon.name, coupon.code)}
                    className="shrink-0 rounded-full border-2 border-dashed border-[#18314a] px-4 py-2 text-xs font-bold transition-colors hover:bg-[#f5c65c]"
                  >
                    {copied === coupon.name ? "Copiado ✓" : "Copiar"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#10263a] text-white">
        <div className="page-shell flex flex-col gap-4 py-10 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>Quer ver como as doações são usadas?</p>
          <a href="/prestacao-de-contas" className="font-bold text-white">Ver prestação de contas →</a>
        </div>
      </footer>
    </main>
  );
}
