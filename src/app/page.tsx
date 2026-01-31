"use client";

import { useEffect, useMemo, useState } from "react";

import styles from "./page.module.css";

const SERVICES = [
    {
        title: "Driveway clearing",
        description: "Full driveway cleared with a standard shovel. Fast turnarounds for single-car and double-car driveways.",
    },
    {
        title: "Walkways + steps",
        description: "Front steps, sidewalks, and paths cleared so you can get in and out safely.",
    },
    {
        title: "De-ice touchups",
        description: "Light ice scraping and extra passes for packed snow. (No salt or chemicals.)",
    },
];

const PRICING = [
    {
        name: "Short job",
        price: "$15",
        details: ["Smaller driveway", "Fits about 2 cars", "Shovel-based clearing"],
    },
    {
        name: "Long job",
        price: "$30+",
        details: ["Longer driveway", "Extra clearing time", "Final price confirmed before start"],
    },
];

const TESTIMONIALS = [
    {
        quote:
            "Carter showed up fast and cleared everything before I left for work. Super friendly and thorough.",
        name: "Local homeowner",
    },
    {
        quote:
            "Great communication and a clean finish. My walkway was safer immediately.",
        name: "Neighbor referral",
    },
    {
        quote:
            "Reliable and honest. Exactly what I needed after the storm.",
        name: "Repeat client",
    },
];

const FAQS = [
    {
        q: "Do you use a snow blower?",
        a: "No, I use a standard shovel for a clean and careful finish. Great for driveways and walkways.",
    },
    {
        q: "How fast can you get here?",
        a: "I aim for same-day service depending on storm size and schedule. Texting is the fastest way to reach me.",
    },
    {
        q: "Do you do seasonal plans?",
        a: "Yes, I can set up a recurring plan for storms. Reach out and we can schedule it.",
    },
];

export default function Home() {
    const [address, setAddress] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [estimate, setEstimate] = useState<null | {
        sqft: number;
        price: number;
        rate: number;
        jobType: string;
        timestamp: number;
    }>(null);
    const [discountSecondsLeft, setDiscountSecondsLeft] = useState(0);
    const [requestName, setRequestName] = useState("");
    const [requestEmail, setRequestEmail] = useState("");
    const [requestAddress, setRequestAddress] = useState("");
    const [requestDetails, setRequestDetails] = useState("");

    const handleEstimate = async () => {
        if (!address.trim()) {
            setError("Enter an address to estimate pricing.");
            return;
        }
        setIsLoading(true);
        setError("");
        setEstimate(null);
        try {
            const response = await fetch("/api/estimate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address: address.trim() }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.error ?? "Unable to estimate price.");
            }
            setEstimate({
                sqft: data.sqft,
                price: data.price,
                rate: data.rate,
                jobType: data.jobType,
                timestamp: data.timestamp,
            });
            setRequestAddress(address.trim());
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unable to estimate price.";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!estimate) {
            setDiscountSecondsLeft(0);
            return;
        }

        const updateCountdown = () => {
            const elapsed = Math.floor((Date.now() - estimate.timestamp) / 1000);
            const remaining = Math.max(0, 600 - elapsed);
            setDiscountSecondsLeft(remaining);
        };

        updateCountdown();
        const interval = window.setInterval(updateCountdown, 1000);
        return () => window.clearInterval(interval);
    }, [estimate]);

    const discountPercent = useMemo(() => {
        if (!estimate || discountSecondsLeft <= 0) {
            return 0;
        }
        const elapsed = 600 - discountSecondsLeft;
        if (elapsed <= 300) {
            return Number((15 - (elapsed / 300) * 5).toFixed(2));
        }
        return Number(Math.max(0, 10 - ((elapsed - 300) / 300) * 10).toFixed(2));
    }, [discountSecondsLeft, estimate]);

    const discountedPrice = useMemo(() => {
        if (!estimate) {
            return null;
        }
        const discount = estimate.price * (discountPercent / 100);
        return Number((estimate.price - discount).toFixed(2));
    }, [estimate, discountPercent]);

    const mailtoLink = useMemo(() => {
        if (!requestName.trim() || !requestAddress.trim()) {
            return "";
        }
        const subject = `Snow removal request from ${requestName.trim()}`;
        const lines = [
            `Name: ${requestName.trim()}`,
            `Email: ${requestEmail.trim() || "(not provided)"}`,
            `Address: ${requestAddress.trim()}`,
            `Details: ${requestDetails.trim() || "(none)"}`,
        ];
        if (estimate) {
            lines.push(
                `Estimate sqft: ${estimate.sqft.toLocaleString()}`,
                `Base price: $${estimate.price.toFixed(2)} (${estimate.jobType})`,
                `Dynamic rate: $${estimate.rate.toFixed(4)} per sq ft`,
                `Discount: ${discountPercent}%`,
                `Final price: $${discountedPrice?.toFixed(2)}`
            );
        }
        const body = lines.join("\n");
        return `mailto:cartermoyer75@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }, [
        requestName,
        requestEmail,
        requestAddress,
        requestDetails,
        estimate,
        discountPercent,
        discountedPrice,
    ]);
    return (
        <main className={styles.main}>
            <section className={styles.hero}>
                <div className={styles.heroInner}>
                    <div className={styles.heroCard}>
                        <div className={styles.pillRow}>
                            <span className={styles.pill}>Local • Reliable</span>
                            <span className={styles.pill}>Shovel-based</span>
                            <span className={styles.pill}>Same-day priority</span>
                        </div>
                        <div>
                            <h1 className={styles.heroTitle}>Snow removal that feels safe, fast, and personal.</h1>
                            <p className={styles.heroSubtitle}>
                                I’m Carter Moyer, a 20-year-old computer science student offering careful snow removal for
                                driveways, walkways, and steps. I use a standard shovel for a clean finish and a neighborly
                                experience.
                            </p>
                        </div>
                        <div className={styles.ctaRow}>
                            <a className={styles.primaryButton} href="#contact">
                                Get a quick quote
                            </a>
                            <a className={styles.secondaryButton} href="#pricing">
                                View pricing
                            </a>
                        </div>
                        <div className={styles.statRow}>
                            <div className={styles.stat}>
                                <strong>Fast response</strong>
                                <div className="has-text-grey">Same-day when possible</div>
                            </div>
                            <div className={styles.stat}>
                                <strong>Careful clearing</strong>
                                <div className="has-text-grey">Driveways, walkways, steps</div>
                            </div>
                            <div className={styles.stat}>
                                <strong>Honest pricing</strong>
                                <div className="has-text-grey">No hidden fees</div>
                            </div>
                        </div>
                    </div>
                    <div className={styles.heroImageWrap}>
                        <div className={styles.heroImage}>
                            <img src="/images/carter.jpg" alt="Carter Moyer" />
                        </div>
                        <div className={styles.trustCard}>
                            <h2 className="title is-5">Trust & transparency</h2>
                            <p className="has-text-grey">
                                I’m building my future and saving for college. You’ll always know who is showing up and what
                                you’re paying for.
                            </p>
                            <a className={styles.linkButton} href="https://carter-portfolio.fyi" target="_blank" rel="noreferrer">
                                View my portfolio
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            <section id="services" className={styles.section}>
                <div className={styles.sectionInner}>
                    <div>
                        <h2 className={styles.sectionTitle}>Services that keep your home safe</h2>
                        <p className={styles.sectionSubtitle}>
                            Focused on the essentials: safe access, clean edges, and respectful service. Perfect for small to
                            medium residential properties.
                        </p>
                    </div>
                    <div className={styles.gridThree}>
                        {SERVICES.map((service) => (
                            <div key={service.title} className={styles.card}>
                                <h3 className="title is-5">{service.title}</h3>
                                <p className="has-text-grey">{service.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="pricing" className={styles.section}>
                <div className={styles.sectionInner}>
                    <div>
                        <h2 className={styles.sectionTitle}>Simple, upfront pricing</h2>
                        <p className={styles.sectionSubtitle}>
                            Pricing is based on average snowfall. Heavy storms or large driveways may cost slightly more.
                            I’ll confirm before I start.
                        </p>
                    </div>
                    <div className={styles.pricingGrid}>
                        {PRICING.map((plan) => (
                            <div key={plan.name} className={styles.card}>
                                <h3 className="title is-5">{plan.name}</h3>
                                <div className={styles.price}>{plan.price}</div>
                                <ul className={styles.list}>
                                    {plan.details.map((detail) => (
                                        <li key={detail}>{detail}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                    <div className={styles.formCard}>
                        <h3 className="title is-5">Instant driveway estimate (La Crosse, WI)</h3>
                        <p className="has-text-grey">
                            Enter your address for a quick estimate based on public parcel data and a per-square-foot rate.
                        </p>
                        <div className="field">
                            <label className="label" htmlFor="estimate-address">Address</label>
                            <div className="control">
                                <input
                                    className="input"
                                    id="estimate-address"
                                    placeholder="123 Main St, La Crosse, WI"
                                    type="text"
                                    value={address}
                                    onChange={(event) => setAddress(event.target.value)}
                                />
                            </div>
                        </div>
                        <button className={styles.primaryButton} type="button" onClick={handleEstimate} disabled={isLoading}>
                            {isLoading ? "Estimating..." : "Estimate price"}
                        </button>
                        {error ? <div className={styles.estimateError}>{error}</div> : null}
                        {estimate ? (
                            <div className={styles.estimateResult}>
                                <div>
                                    <strong>Driveway size:</strong> {estimate.sqft.toLocaleString()} sq ft
                                </div>
                                <div>
                                    <strong>Estimated price:</strong> ${estimate.price.toFixed(2)} ({estimate.jobType})
                                </div>
                                <div>
                                    <strong>Dynamic rate:</strong> ${estimate.rate.toFixed(4)} per sq ft
                                </div>
                                {discountedPrice !== null ? (
                                    <div>
                                        <strong>Limited-time discount:</strong> {discountPercent}% off for the next{ " " }
                                        {Math.floor(discountSecondsLeft / 60)}:{String(discountSecondsLeft % 60).padStart(2, "0")} •
                                        Final price ${discountedPrice.toFixed(2)}
                                    </div>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                </div>
            </section>

            <section id="about" className={styles.section}>
                <div className={styles.sectionInner}>
                    <div className={styles.aboutGrid}>
                        <div>
                            <h2 className={styles.sectionTitle}>A bit about me</h2>
                            <p className={styles.sectionSubtitle}>
                                I’m Carter Moyer, a 20-year-old college student studying computer science. I’m building real
                                skills, saving for tuition, and serving my local community with dependable snow removal.
                            </p>
                            <ul className={styles.list}>
                                <li>Careful around landscaping and doorways</li>
                                <li>Respectful, friendly, and on-time</li>
                                <li>Clear communication before and after service</li>
                            </ul>
                        </div>
                        <div className={styles.portrait}>
                            <img src="/images/carter.jpg" alt="Carter Moyer smiling" />
                        </div>
                    </div>
                </div>
            </section>

            <section className={styles.section}>
                <div className={styles.sectionInner}>
                    <div>
                        <h2 className={styles.sectionTitle}>What clients say</h2>
                        <p className={styles.sectionSubtitle}>Simple, dependable service that makes winter easier.</p>
                    </div>
                    <div className={styles.gridThree}>
                        {TESTIMONIALS.map((testimonial) => (
                            <div key={testimonial.name} className={styles.card}>
                                <p className="has-text-grey">“{testimonial.quote}”</p>
                                <strong>{testimonial.name}</strong>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className={styles.section}>
                <div className={styles.sectionInner}>
                    <div className={styles.ctaBanner}>
                        <h2 className="title is-3 has-text-white">Need snow cleared today?</h2>
                        <p>
                            Message me with your address and what you need cleared. I’ll reply quickly with availability and
                            pricing.
                        </p>
                        <div className={styles.ctaRow}>
                            <a className={styles.secondaryButton} href="#contact">
                                Send a request
                            </a>
                            <a className={styles.linkButton} href="https://carter-portfolio.fyi" target="_blank" rel="noreferrer">
                                Check out my portfolio
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            <section className={styles.section}>
                <div className={styles.sectionInner}>
                    <div>
                        <h2 className={styles.sectionTitle}>FAQ</h2>
                    </div>
                    <div className={styles.gridThree}>
                        {FAQS.map((item) => (
                            <div key={item.q} className={styles.card}>
                                <strong>{item.q}</strong>
                                <p className="has-text-grey">{item.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="contact" className={styles.section}>
                <div className={styles.sectionInner}>
                    <div>
                        <h2 className={styles.sectionTitle}>Request a quote</h2>
                        <p className={styles.sectionSubtitle}>
                            Use the form to share your address and what you need cleared. I’ll follow up quickly.
                        </p>
                    </div>
                    <div className={styles.contactGrid}>
                        <div className={styles.formCard}>
                            <div className="field">
                                <label className="label" htmlFor="name">Name</label>
                                <div className="control">
                                    <input
                                        className="input"
                                        id="name"
                                        placeholder="Your name"
                                        type="text"
                                        value={requestName}
                                        onChange={(event) => setRequestName(event.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="field">
                                <label className="label" htmlFor="email">Email (optional)</label>
                                <div className="control">
                                    <input
                                        className="input"
                                        id="email"
                                        placeholder="you@email.com"
                                        type="email"
                                        value={requestEmail}
                                        onChange={(event) => setRequestEmail(event.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="field">
                                <label className="label" htmlFor="address">Address</label>
                                <div className="control">
                                    <input
                                        className="input"
                                        id="address"
                                        placeholder="Street address"
                                        type="text"
                                        value={requestAddress}
                                        onChange={(event) => setRequestAddress(event.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="field">
                                <label className="label" htmlFor="details">Details</label>
                                <div className="control">
                                    <textarea
                                        className="textarea"
                                        id="details"
                                        placeholder="Driveway size, walkway, steps, timing"
                                        value={requestDetails}
                                        onChange={(event) => setRequestDetails(event.target.value)}
                                    />
                                </div>
                            </div>
                            <a
                                className={styles.primaryButton}
                                href={mailtoLink || "#"}
                                aria-disabled={!mailtoLink}
                                onClick={(event) => {
                                    if (!mailtoLink) {
                                        event.preventDefault();
                                    }
                                }}
                            >
                                Email request
                            </a>
                            {!mailtoLink ? (
                                <div className={styles.estimateError}>Name and address are required.</div>
                            ) : null}
                        </div>
                        <div className={styles.formCard}>
                            <h3 className="title is-5">Quick contact</h3>
                            <p className="has-text-grey">
                                Texting is the fastest way to reach me. You can also email and I’ll respond ASAP.
                            </p>
                            <div>
                                <strong>Phone:</strong> <span className="has-text-grey">920-904-2695</span>
                            </div>
                            <div>
                                <strong>Email:</strong> <span className="has-text-grey">cartermoyer75@gmail.com</span>
                            </div>
                            <div>
                                <strong>Service area:</strong> <span className="has-text-grey">Local neighborhoods within 15 miles</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <footer className={styles.footer}>
                <div>
                    © {new Date().getFullYear()} Carter Moyer Snow Removal. Built with care for local neighbors.
                </div>
                <div>
                    <a className={styles.linkButton} href="/privacy">Privacy policy</a>
                </div>
            </footer>
        </main>
    );
}
