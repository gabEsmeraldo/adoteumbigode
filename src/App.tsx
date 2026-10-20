import { useEffect, useState } from "react";
import heroMain from "./imports/IMG-20220711-WA0099.jpg";
import heroTeam from "./imports/IMG-20190707-WA0083.jpg";
import heroRescue from "./imports/IMG-20230128-WA0100.jpg";
import donationImage from "./imports/IMG-20230712-WA0192.jpg";
import volunteerImage from "./imports/IMG-20260206-WA0093.jpg";
import logo from "./imports/sticker_logo.png";
import QRCode from "qrcode";
import { pixKey, pixPayload } from "./pix";

const VOLUNTEER_EMAIL = "gabrielcesmeraldo@gmail.com";

function buildVolunteerMailto(name: string, whatsapp: string) {
  const digits = whatsapp.replace(/\D/g, "");
  const phone = digits.length <= 11 ? `55${digits}` : digits;
  const subject = "Voluntario adote um bigode";
  const body = `Olá, me chamo ${name} e me cadastrei pelo site para ser voluntario do projeto.\n\nEntre em contato -> https://wa.me/${phone}`;
  return `mailto:${VOLUNTEER_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function formatPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

const navigation = [
  { label: "Home", href: "#home" },
  { label: "Sobre nós", href: "#sobre" },
  { label: "Resgates", href: "#resgates" },
  { label: "Prestação de contas", href: "#transparencia" },
  { label: "Voluntariado", href: "#voluntariado" },
];

const steps = [
  {
    number: "01",
    title: "Resgatamos",
    description:
      "Atendemos gatinhos em situação de risco e organizamos o primeiro acolhimento.",
  },
  {
    number: "02",
    title: "Cuidamos",
    description:
      "Garantimos alimentação, segurança, atendimento veterinário e muito carinho.",
  },
  {
    number: "03",
    title: "Encontramos um lar",
    description:
      "Conectamos cada gatinho a uma família preparada para uma adoção responsável.",
  },
];

function HomePage() {
  const [isVolunteerFormOpen, setIsVolunteerFormOpen] = useState(false);
  const [whatsapp, setWhatsapp] = useState("");
  const [isDonationOpen, setIsDonationOpen] = useState(false);
  const [isPixCopied, setIsPixCopied] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  useEffect(() => {
    let previousScrollY = window.scrollY;

    const updateHeaderVisibility = () => {
      const currentScrollY = window.scrollY;
      const scrollDifference = currentScrollY - previousScrollY;

      if (currentScrollY <= 16) {
        setIsHeaderVisible(true);
        previousScrollY = currentScrollY;
      } else if (Math.abs(scrollDifference) >= 8) {
        setIsHeaderVisible(scrollDifference < 0);
        previousScrollY = currentScrollY;
      }
    };

    window.addEventListener("scroll", updateHeaderVisibility, { passive: true });

    return () => window.removeEventListener("scroll", updateHeaderVisibility);
  }, []);

  useEffect(() => {
    if (!isVolunteerFormOpen && !isDonationOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsVolunteerFormOpen(false);
        setIsDonationOpen(false);
        setIsPixCopied(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isVolunteerFormOpen, isDonationOpen]);

  const closeDonation = () => {
    setIsDonationOpen(false);
    setIsPixCopied(false);
  };

  const [pixQrCode, setPixQrCode] = useState("");

  useEffect(() => {
    QRCode.toDataURL(pixPayload, { margin: 1, width: 448 }).then(setPixQrCode);
  }, []);

  const copyPixKey = async () => {
    await navigator.clipboard.writeText(pixPayload);
    setIsPixCopied(true);
  };

  return (
    <main id="home" className="min-h-screen overflow-x-clip bg-[#f7f5ef] text-[#18314a]">
      <header
        className={`sticky top-0 z-40 border-b border-[#18314a]/15 bg-[#f7f5ef] transition-transform duration-300 motion-reduce:transition-none ${
          isHeaderVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="page-shell flex h-20 items-center justify-between gap-6 lg:h-24">
          <a href="#home" aria-label="Adote um Bigode — início" className="shrink-0">
            <img
              src={logo}
              alt="Adote um Bigode"
              className="h-12 w-auto object-contain lg:h-16"
            />
          </a>

          <nav
            aria-label="Navegação principal"
            className="hidden items-center gap-7 text-[13px] font-semibold lg:flex"
          >
            {navigation.map((item, index) => (
              <a
                key={item.label}
                href={item.href}
                className={`transition-colors hover:text-[#1263a5] ${
                  index === 0 ? "text-[#1263a5]" : ""
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <a href="#voluntariado" className="button-primary hidden sm:inline-flex">
            Quero ajudar
          </a>
        </div>

        <nav
          aria-label="Navegação principal para celular"
          className="page-shell flex flex-wrap gap-x-5 gap-y-2 border-t border-[#18314a]/10 py-3 text-xs font-semibold lg:hidden"
        >
          {navigation.map((item) => (
            <a key={item.label} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      <section className="page-shell pb-20 pt-10 lg:pb-28 lg:pt-16">
        <div className="mb-10 grid gap-7 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
          <div>
            <p className="eyebrow">Resgate, cuidado e adoção responsável</p>
            <h1 className="mt-5 max-w-4xl text-5xl font-bold leading-[.98] tracking-[-0.045em] sm:text-6xl lg:text-[78px]">
              Todo gatinho merece um{" "}
              <span className="relative whitespace-nowrap text-[#1263a5]">
                lar seguro.
                <span className="absolute -bottom-2 left-1 h-2 w-[96%] -rotate-1 rounded-full bg-[#f0b43b]/70" />
              </span>
            </h1>
          </div>
          <div className="max-w-lg lg:justify-self-end">
            <p className="text-lg leading-relaxed text-[#18314a]/75">
              Somos uma rede de pessoas que transforma resgates em recomeços.
              Acolhemos, cuidamos e encontramos famílias para gatinhos que
              precisam de uma nova chance.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#resgates" className="button-primary">
                Conheça o projeto <span aria-hidden="true">→</span>
              </a>
              <a href="#sobre" className="button-secondary">
                Nossa história
              </a>
            </div>
          </div>
        </div>

        <div className="relative grid h-[490px] grid-cols-12 grid-rows-2 gap-3 sm:h-[570px] sm:gap-4 lg:h-[610px]">
          <figure className="photo-frame col-span-12 row-span-1 sm:col-span-8 sm:row-span-2">
            <img
              src={heroMain}
              alt="Voluntária do projeto com gatinhos acolhidos"
              className="h-full w-full object-cover object-[50%_70%]"
            />
            <figcaption className="photo-label">Acolhimento</figcaption>
          </figure>
          <figure className="photo-frame col-span-6 sm:col-span-4">
            <img
              src={heroTeam}
              alt="Equipe de voluntárias em uma ação de adoção"
              className="h-full w-full object-cover"
            />
            <figcaption className="photo-label">Nossa rede</figcaption>
          </figure>
          <figure className="photo-frame col-span-6 sm:col-span-4">
            <img
              src={heroRescue}
              alt="Voluntárias durante o atendimento de um gatinho"
              className="h-full w-full object-cover object-center"
            />
            <figcaption className="photo-label">Novos começos</figcaption>
          </figure>
          <div className="absolute -bottom-9 right-4 hidden rotate-2 rounded-sm bg-[#f0b43b] px-5 py-4 text-sm font-bold shadow-[4px_4px_0_#18314a] sm:block">
            Feito por voluntários,
            <br />
            movido por afeto.
          </div>
        </div>
      </section>

      <section id="sobre" className="scroll-mt-24 border-y border-[#18314a]/15 bg-white">
        <div className="page-shell grid gap-12 py-20 lg:grid-cols-[.72fr_1.28fr] lg:py-28">
          <div>
            <p className="eyebrow">Sobre nós</p>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-[#18314a]/60">
              Uma organização independente formada por pessoas que acreditam
              que cuidado coletivo muda destinos.
            </p>
          </div>
          <div>
            <h2 className="section-title max-w-4xl">
              Criamos uma ponte entre gatinhos vulneráveis e famílias cheias de
              amor para dar.
            </h2>
            <div className="mt-10 grid gap-6 border-t border-[#18314a]/15 pt-8 sm:grid-cols-2">
              <p className="body-copy">
                O Adote um Bigode nasceu da vontade de mudar a realidade dos
                gatos abandonados. Nosso trabalho acompanha toda a jornada: do
                resgate à adaptação no novo lar.
              </p>
              <p className="body-copy">
                Não temos abrigo próprio. Funcionamos através de lares
                temporários, parcerias e uma rede dedicada de voluntários e
                apoiadores.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="resgates" className="scroll-mt-24 bg-[#dcebf5]">
        <div className="page-shell py-20 lg:py-28">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
            <div>
              <p className="eyebrow">Como atuamos</p>
              <h2 className="section-title mt-4">Do resgate ao colo.</h2>
            </div>
            <p className="body-copy max-w-lg lg:justify-self-end">
              Cada caso é uma corrente de cuidado. Veja as etapas que
              transformam uma situação de risco em uma história de adoção.
            </p>
          </div>

          <div className="mt-12 grid border-y border-[#18314a]/20 md:grid-cols-3">
            {steps.map((step) => (
              <article
                key={step.number}
                className="border-b border-[#18314a]/20 py-8 last:border-0 md:border-b-0 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0 md:last:pr-0"
              >
                <span className="text-sm font-bold text-[#1263a5]">
                  {step.number}
                </span>
                <h3 className="mt-12 text-2xl font-bold tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-[#18314a]/70">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="transparencia" className="scroll-mt-24 bg-[#f7f5ef]">
        <div className="page-shell grid gap-12 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
          <div className="relative">
            <div className="photo-frame aspect-[4/3] -rotate-1">
              <img
                src={donationImage}
                alt="Doação de alimentos recebida pelo projeto"
                className="h-full w-full object-cover"
              />
            </div>
            <span className="absolute -bottom-5 -right-2 rounded-sm bg-white px-4 py-3 text-xs font-bold shadow-[3px_3px_0_#18314a] sm:right-8">
              Toda ajuda vira cuidado.
            </span>
          </div>

          <div className="lg:pl-12">
            <p className="eyebrow">Prestação de contas</p>
            <h2 className="section-title mt-4">
              Transparência faz parte da nossa missão.
            </h2>
            <p className="body-copy mt-6 max-w-xl">
              Compartilhamos como cada doação é utilizada, os custos dos
              atendimentos e os resultados das nossas ações. Assim, quem ajuda
              pode acompanhar de perto o impacto que está construindo.
            </p>
            <a
              href="#transparencia"
              className="mt-8 inline-flex border-b-2 border-[#f0b43b] pb-1 text-sm font-bold"
            >
              Ver relatórios e atualizações <span className="ml-2" aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </section>

      <section id="voluntariado" className="scroll-mt-24 bg-[#1263a5] text-white">
        <div className="page-shell grid gap-10 py-16 lg:grid-cols-[1fr_.7fr] lg:items-center lg:py-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f5c65c]">
              Faça parte
            </p>
            <h2 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-[-0.035em] sm:text-5xl">
              Tem muitas formas de ajudar um bigode.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/75">
              Seja lar temporário, participe das ações, ofereça transporte,
              divulgue ou contribua com os cuidados veterinários.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setIsVolunteerFormOpen(true)}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#f5c65c] px-6 text-sm font-bold text-[#18314a] transition-transform hover:-translate-y-0.5"
              >
                Quero ser voluntário{" "}
                <span className="ml-2" aria-hidden="true">
                  →
                </span>
              </button>
              <button
                type="button"
                onClick={() => setIsDonationOpen(true)}
                className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-white/60 px-6 text-sm font-bold text-white transition-colors hover:bg-white hover:text-[#18314a]"
              >
                Quero doar
              </button>
            </div>
          </div>
          <div className="photo-frame aspect-[4/3] rotate-1 border-white/80">
            <img
              src={volunteerImage}
              alt="Voluntárias do projeto em uma ação"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <footer className="bg-[#10263a] text-white">
        <div className="page-shell flex flex-col gap-7 py-10 sm:flex-row sm:items-end sm:justify-between">
          <img src={logo} alt="Adote um Bigode" className="h-16 w-auto self-start" />
          <div className="text-left text-xs leading-relaxed text-white/55 sm:text-right">
            <p>Resgate e adoção responsável de gatos.</p>
            <p>Projeto de homepage — conteúdo ilustrativo.</p>
          </div>
        </div>
      </footer>

      {isVolunteerFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#10263a]/75 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsVolunteerFormOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="volunteer-form-title"
            className="w-full max-w-md rounded-2xl border-2 border-[#18314a] bg-[#f7f5ef] p-6 text-[#18314a] shadow-[8px_8px_0_#f5c65c] sm:p-8"
          >
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="eyebrow">Faça parte</p>
                <h2
                  id="volunteer-form-title"
                  className="mt-2 text-3xl font-bold tracking-[-0.035em]"
                >
                  Quero ser voluntário
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsVolunteerFormOpen(false)}
                className="rounded-full border border-[#18314a]/25 px-3 py-2 text-xs font-bold transition-colors hover:bg-white"
                aria-label="Fechar formulário"
              >
                Fechar
              </button>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-[#18314a]/70">
              Deixe seus dados e entraremos em contato para contar como você
              pode ajudar.
            </p>

            <form
              className="mt-6 space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                window.location.href = buildVolunteerMailto(
                  String(data.get("name")).trim(),
                  String(data.get("whatsapp")),
                );
                setIsVolunteerFormOpen(false);
              }}
            >
              <label className="block text-sm font-bold">
                Nome completo
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  autoFocus
                  required
                  placeholder="Digite seu nome"
                  className="mt-2 min-h-12 w-full rounded-lg border-2 border-[#18314a]/30 bg-white px-4 font-normal outline-none transition-colors placeholder:text-[#18314a]/35 focus:border-[#1263a5]"
                />
              </label>

              <label className="block text-sm font-bold">
                WhatsApp
                <input
                  type="tel"
                  name="whatsapp"
                  autoComplete="tel"
                  inputMode="tel"
                  required
                  value={whatsapp}
                  onChange={(event) => setWhatsapp(formatPhone(event.target.value))}
                  pattern="\(\d{2}\) \d{4,5}-\d{4}"
                  title="Informe o DDD e o número, ex.: (85) 99999-1234"
                  placeholder="(00) 00000-0000"
                  className="mt-2 min-h-12 w-full rounded-lg border-2 border-[#18314a]/30 bg-white px-4 font-normal outline-none transition-colors placeholder:text-[#18314a]/35 focus:border-[#1263a5]"
                />
              </label>

              <button type="submit" className="button-primary w-full">
                Enviar
              </button>
            </form>
          </div>
        </div>
      )}

      {isDonationOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#10263a]/80 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDonation();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="donation-title"
            className="my-auto w-full max-w-2xl rounded-2xl border-2 border-[#18314a] bg-[#f7f5ef] p-6 text-[#18314a] shadow-[8px_8px_0_#f5c65c] sm:p-8"
          >
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="eyebrow">Apoie o projeto</p>
                <h2
                  id="donation-title"
                  className="mt-2 text-3xl font-bold tracking-[-0.035em] sm:text-4xl"
                >
                  Sua ajuda vira cuidado.
                </h2>
              </div>
              <button
                type="button"
                onClick={closeDonation}
                className="rounded-full border border-[#18314a]/25 px-3 py-2 text-xs font-bold transition-colors hover:bg-white"
                aria-label="Fechar opções de doação"
              >
                Fechar
              </button>
            </div>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#18314a]/70">
              Escolha a melhor forma de contribuir com alimentação,
              atendimento veterinário e resgates.
            </p>

            <div className="mt-6 rounded-xl border-2 border-[#1263a5] bg-[#e8f0f5] p-5">
              <div className="grid gap-5 sm:grid-cols-[1fr_132px] sm:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1263a5]">
                    Doação por Pix
                  </p>
                  <p className="mt-2 text-lg font-bold break-all">
                    adoteumbigodece@gmail.com
                  </p>
                  <button
                    type="button"
                    onClick={copyPixKey}
                    className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-[#18314a] px-5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
                  >
                    {isPixCopied ? "Código copiado" : "Copiar Pix copia e cola"}
                  </button>
                </div>
                <div className="w-fit rounded-xl border border-[#18314a]/15 bg-[#f7f5ef] p-2 text-center">
                  <img
                    src={pixQrCode}
                    alt={`QR Code Pix para a chave ${pixKey}`}
                    className="h-28 w-28"
                  />
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em]">
                    Escaneie no app do banco
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <a
                href="https://apoia.se/adoteumbigodece"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-[#18314a]/20 bg-white p-5 transition-transform hover:-translate-y-0.5"
              >
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#1263a5]">
                  Apoia.se
                </p>
                <p className="mt-2 font-bold">Apoio recorrente</p>
                <p className="mt-1 text-sm leading-relaxed text-[#18314a]/60">
                  Contribua mensalmente com o valor que escolher.
                </p>
                <span className="mt-4 inline-block text-sm font-bold">
                  Acessar Apoia.se →
                </span>
              </a>
              <a
                href="https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=2c9380849817d4a3019819c9df8f00b7"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-[#18314a]/20 bg-white p-5 transition-transform hover:-translate-y-0.5"
              >
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#1263a5]">
                  Mercado Pago
                </p>
                <p className="mt-2 font-bold">Assinatura mensal</p>
                <p className="mt-1 text-sm leading-relaxed text-[#18314a]/60">
                  Cadastre uma contribuição recorrente com segurança.
                </p>
                <span className="mt-4 inline-block text-sm font-bold">
                  Assinar agora →
                </span>
              </a>
            </div>

            <div className="mt-7 border-t border-[#18314a]/15 pt-6">
              <p className="text-xs font-bold uppercase tracking-[0.14em]">
                Use nossos links de afiliado
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#18314a]/60">
                Suas compras também podem apoiar o projeto sem custo adicional.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href="https://minhaloja.cobasi.com.br/?utm_source=mais&utm_medium=maisplataforma&utm_campaign=adoteumbigode"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[#18314a]/25 bg-white px-4 py-2 text-sm font-bold transition-colors hover:border-[#1263a5] hover:text-[#1263a5]"
                >
                  Cobasi
                </a>
                <a
                  href="https://minhaloja.cobasi.com.br/paco#adoteumbigode"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[#18314a]/25 bg-white px-4 py-2 text-sm font-bold transition-colors hover:border-[#1263a5] hover:text-[#1263a5]"
                >
                  Cobasi — Paço
                </a>
                <a
                  href="https://amzn.to/3P63wHC"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[#18314a]/25 bg-white px-4 py-2 text-sm font-bold transition-colors hover:border-[#1263a5] hover:text-[#1263a5]"
                >
                  Amazon
                </a>
                <a
                  href="https://s.shopee.com.br/801ADDenon"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[#18314a]/25 bg-white px-4 py-2 text-sm font-bold transition-colors hover:border-[#1263a5] hover:text-[#1263a5]"
                >
                  Shopee
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default HomePage;
