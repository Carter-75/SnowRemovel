"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Image from "next/image";
import anime from "animejs";
import * as Matter from "matter-js";

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
        price: "≈ $15+",
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
        basePrice: number;
        upchargeAmount: number;
        upchargeApplied: boolean;
        rate: number;
        jobType: string;
        driveFee: number;
        driveMiles: number;
        driveMinutes: number;
        roundTripMiles: number;
        roundTripMinutes: number;
        upfrontFee: number;
        timestamp: number;
    }>(null);
    const [discountSecondsLeft, setDiscountSecondsLeft] = useState(0);
    const [urgentService, setUrgentService] = useState(false);
    const [requestName, setRequestName] = useState("");
    const [requestEmail, setRequestEmail] = useState("");
    const [requestAddress, setRequestAddress] = useState("");
    const [requestTimeframe, setRequestTimeframe] = useState("");
    const [requestDetails, setRequestDetails] = useState("");
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [downloadedTerms, setDownloadedTerms] = useState(false);
    const [emergencyWaiver, setEmergencyWaiver] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState("");
    const heroCardRef = useRef<HTMLDivElement | null>(null);
    const heroImageRef = useRef<HTMLDivElement | null>(null);
    const snowSceneRef = useRef<HTMLDivElement | null>(null);

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
                body: JSON.stringify({ address: address.trim(), urgentService }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.error ?? "Unable to estimate price.");
            }
            setEstimate({
                sqft: data.sqft,
                price: data.price,
                basePrice: data.basePrice,
                upchargeAmount: data.upchargeAmount,
                upchargeApplied: data.upchargeApplied,
                rate: data.rate,
                jobType: data.jobType,
                driveFee: data.driveFee,
                driveMiles: data.driveMiles,
                driveMinutes: data.driveMinutes,
                roundTripMiles: data.roundTripMiles,
                roundTripMinutes: data.roundTripMinutes,
                upfrontFee: data.upfrontFee,
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

    const totalWithDrive = useMemo(() => {
        if (!estimate) {
            return null;
        }
        const base = discountedPrice ?? estimate.price;
        return Number((base + estimate.driveFee).toFixed(2));
    }, [estimate, discountedPrice]);

    const canSubmit = useMemo(() => {
        return (
            Boolean(requestName.trim()) &&
            Boolean(requestAddress.trim()) &&
            agreedToTerms &&
            downloadedTerms &&
            (!urgentService || emergencyWaiver)
        );
    }, [requestName, requestAddress, agreedToTerms, downloadedTerms, urgentService, emergencyWaiver]);


    const handlePayment = async () => {
        setPaymentStatus("");
        if (!estimate || !totalWithDrive || !canSubmit) {
            setPaymentStatus("Get an estimate first.");
            return;
        }
        try {
            const response = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: requestName.trim() || "Customer",
                    email: requestEmail.trim(),
                    address: requestAddress.trim() || address.trim(),
                    timeframe: requestTimeframe.trim(),
                    urgentService,
                    estimateTimestamp: estimate.timestamp,
                }),
            });
            const data = await response.json();
            if (!response.ok || !data.url) {
                throw new Error(data?.error ?? "Unable to start payment.");
            }
            window.location.href = data.url;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unable to start payment.";
            setPaymentStatus(message);
        }
    };

    useEffect(() => {
        if (!heroCardRef.current || !heroImageRef.current) {
            return;
        }
        anime({
            targets: heroCardRef.current,
            translateY: [16, 0],
            opacity: [0, 1],
            duration: 900,
            easing: "easeOutQuad",
        });
        anime({
            targets: heroImageRef.current,
            translateY: [12, 0],
            opacity: [0, 1],
            duration: 1200,
            easing: "easeOutQuad",
            delay: 120,
        });
        anime({
            targets: heroImageRef.current,
            translateY: [0, -8],
            direction: "alternate",
            easing: "easeInOutSine",
            duration: 2200,
            loop: true,
        });
    }, []);

    useEffect(() => {
        const container = snowSceneRef.current;
        if (!container) {
            return;
        }

        if (window.innerWidth === 0) {
            return;
        }

        const engine = Matter.Engine.create();
        engine.enableSleeping = true;
        engine.gravity.y = 0.22;
        const initialWidth = window.innerWidth;
        const initialHeight = Math.max(window.innerHeight, 220);
        const render = Matter.Render.create({
            element: container,
            engine,
            options: {
                width: initialWidth,
                height: initialHeight,
                background: "transparent",
                wireframes: false,
                pixelRatio: window.devicePixelRatio || 1,
            },
        });

        let currentWidth = initialWidth;
        let currentHeight = initialHeight;

        const ground = Matter.Bodies.rectangle(initialWidth / 2, initialHeight - 1, initialWidth, 8, {
            isStatic: true,
            friction: 1,
            frictionStatic: 1,
            restitution: 0,
            render: { fillStyle: "rgba(255,255,255,0.0)" },
        });

        Matter.World.add(engine.world, [ground]);

        const MAX_FLAKES = 220;
        const spawnSnow = () => {
            if (engine.world.bodies.length > MAX_FLAKES) {
                return;
            }
            const radius = 1.8 + Math.random() * 2.8;
            const snowflake = Matter.Bodies.circle(
            Math.random() * currentWidth,
                -20,
                radius,
                {
                    frictionAir: 0.1 + Math.random() * 0.04,
                    restitution: 0.02,
                    friction: 0.9,
                    frictionStatic: 0.9,
                    density: 0.0012,
                    sleepThreshold: 55,
                    render: { fillStyle: "rgba(255,255,255,0.9)" },
                }
            );
            (snowflake as Matter.Body & { plugin?: { spawnedAt?: number } }).plugin = {
                spawnedAt: Date.now(),
            };
            Matter.Body.setVelocity(snowflake, {
                x: (Math.random() - 0.5) * 0.12,
                y: 0.04 + Math.random() * 0.12,
            });
            Matter.World.add(engine.world, snowflake);
        };

        const snowInterval = window.setInterval(spawnSnow, 180);
        const windInterval = window.setInterval(() => {
            engine.world.bodies.forEach((body) => {
                if (body.isStatic) {
                    return;
                }
                const wind = (Math.random() - 0.5) * 0.00015;
                Matter.Body.applyForce(body, body.position, { x: wind, y: 0 });
            });
        }, 900);
        const cleanupInterval = window.setInterval(() => {
            const bodies = engine.world.bodies;
            bodies.forEach((body) => {
                const spawnedAt = (body as Matter.Body & { plugin?: { spawnedAt?: number } }).plugin?.spawnedAt;
                if (spawnedAt && Date.now() - spawnedAt < 30000) {
                    return;
                }
                if (!body.isStatic && body.position.y > currentHeight + 120) {
                    Matter.World.remove(engine.world, body);
                }
            });
        }, 1500);

        Matter.Engine.run(engine);
        Matter.Render.run(render);

        const handleResize = () => {
            const width = window.innerWidth;
            const height = Math.max(window.innerHeight, 220);
            currentWidth = width;
            currentHeight = height;
            render.canvas.width = width;
            render.canvas.height = height;
            render.options.width = width;
            render.options.height = height;
            Matter.Body.setPosition(ground, { x: width / 2, y: height - 1 });
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.clearInterval(snowInterval);
            window.clearInterval(windInterval);
            window.clearInterval(cleanupInterval);
            window.removeEventListener("resize", handleResize);
            Matter.Render.stop(render);
            Matter.Engine.clear(engine);
            if (render.canvas.parentNode) {
                render.canvas.parentNode.removeChild(render.canvas);
            }
        };
    }, []);
    return (
        <main className={styles.main}>
            <header className={styles.header}>
                <div className={styles.headerInner}>
                    <div className={styles.logo}>Carter Moyer Snow Removal</div>
                    <nav className={styles.nav}>
                        <a href="#services">Services</a>
                        <a href="#pricing">Pricing</a>
                        <a href="#about">About</a>
                        <a href="#contact">Contact</a>
                    </nav>
                    <a className={styles.primaryButton} href="#pricing">
                        Get a quote
                    </a>
                </div>
            </header>
            <section className={styles.hero}>
                <div ref={snowSceneRef} className={styles.snowScene} aria-hidden="true" />
                <div className={styles.heroGlow} aria-hidden="true" />
                <div className={styles.heroInner}>
                    <div className={styles.heroCard} ref={heroCardRef}>
                        <div className={styles.pillRow}>
                            <span className={styles.pill}>Fast response</span>
                            <span className={styles.pill}>Careful clearing</span>
                            <span className={styles.pill}>Driveways, walkways, steps</span>
                            <span className={styles.pill}>Honest pricing</span>
                            <span className={styles.pill}>No hidden fees</span>
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
                            <a className={styles.primaryButton} href="#pricing">
                                Get a quick quote
                            </a>
                            <a className={styles.secondaryButton} href="#pricing">
                                View pricing
                            </a>
                        </div>
                        <div className={styles.statRow}>
                            <div className={styles.stat}>
                                <strong>Fast response</strong>
                                <div className="has-text-grey">Quick replies & scheduling</div>
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
                    <div className={styles.heroImageWrap} ref={heroImageRef}>
                        <div className={styles.heroImage}>
                            <Image
                                src="/images/carter.jpg"
                                alt="Carter Moyer"
                                fill
                                sizes="(max-width: 900px) 100vw, 45vw"
                                priority
                                className={styles.heroPhoto}
                            />
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
                                Enter your address for a quick estimate based on public parcel data for anywhere in Wisconsin.
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
                            <div className={styles.checkboxRow}>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={urgentService}
                                        onChange={(event) => setUrgentService(event.target.checked)}
                                    />
                                    <span>Service needed within 3 business days (adds 10% convenience upcharge).</span>
                                </label>
                            </div>
                        <button className={styles.primaryButton} type="button" onClick={handleEstimate} disabled={isLoading}>
                            {isLoading ? "Estimating..." : "Estimate price"}
                        </button>
                        {error ? <div className={styles.estimateError}>{error}</div> : null}
                        {estimate ? (
                            <div className={styles.estimateResult}>
                                <div>
                                    <strong>Total estimate:</strong> ${totalWithDrive?.toFixed(2)}
                                </div>
                                <div>
                                    Includes snow removal service and travel fee if applicable.
                                    {estimate.upchargeApplied ? " (10% convenience upcharge included.)" : ""}
                                </div>
                                {discountedPrice !== null ? (
                                    <div>
                                        <strong>Limited-time discount:</strong> {discountPercent}% off for the next{ " " }
                                        {Math.floor(discountSecondsLeft / 60)}:{String(discountSecondsLeft % 60).padStart(2, "0")} •
                                        Final price ${totalWithDrive?.toFixed(2)}
                                    </div>
                                ) : null}
                            </div>
                        ) : null}
                        <div className={styles.contactGrid}>
                            <div className={styles.formCard}>
                                <h4 className="title is-6">Service details (required for payment)</h4>
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
                                    <label className="label" htmlFor="timeframe">Timeframe</label>
                                    <div className="control">
                                        <div className="select is-fullwidth">
                                            <select
                                                id="timeframe"
                                                value={requestTimeframe}
                                                onChange={(event) => setRequestTimeframe(event.target.value)}
                                            >
                                                <option value="">Select timeframe</option>
                                                <option value="Today">Today</option>
                                                <option value="Tomorrow morning">Tomorrow morning</option>
                                                <option value="Tomorrow afternoon">Tomorrow afternoon</option>
                                                <option value="Tomorrow evening">Tomorrow evening</option>
                                                <option value="This weekend">This weekend</option>
                                                <option value="Next week">Next week</option>
                                                <option value="Flexible">Flexible</option>
                                            </select>
                                        </div>
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
                                <div className={styles.downloadRow}>
                                    <a className={styles.secondaryButton} href="/legal/terms.pdf" download>
                                        Download Terms (PDF)
                                    </a>
                                    <a className={styles.secondaryButton} href="/legal/right-to-cancel.pdf" download>
                                        Download Right to Cancel (PDF)
                                    </a>
                                </div>
                                <div className={styles.checkboxRow}>
                                    <label className={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={agreedToTerms}
                                            onChange={(event) => setAgreedToTerms(event.target.checked)}
                                        />
                                        <span>
                                            I have read and agree to the{ " " }
                                            <a href="/terms">Terms and Conditions</a> and{ " " }
                                            <a href="/privacy">Privacy Policy</a>, including the Payment and Cancellation policies.
                                        </span>
                                    </label>
                                </div>
                                <div className={styles.checkboxRow}>
                                    <label className={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={downloadedTerms}
                                            onChange={(event) => setDownloadedTerms(event.target.checked)}
                                        />
                                        <span>
                                            I downloaded the Terms and two copies of the Right to Cancel notice and consent to receive
                                            disclosures electronically.
                                        </span>
                                    </label>
                                </div>
                                <div className={styles.checkboxRow}>
                                    <label className={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={emergencyWaiver}
                                            onChange={(event) => setEmergencyWaiver(event.target.checked)}
                                        />
                                        <span>
                                            I request immediate emergency service and waive my three-day right to cancel as described
                                            in the Terms (only if needed for safety/egress).
                                        </span>
                                    </label>
                                </div>
                                <button
                                    className={styles.secondaryButton}
                                    type="button"
                                    onClick={handlePayment}
                                    disabled={!canSubmit}
                                >
                                    Pay now (full amount)
                                </button>
                                {!canSubmit ? (
                                    <div className={styles.estimateError}>Name, address, and required agreements are needed.</div>
                                ) : null}
                                {paymentStatus ? <div className={styles.estimateError}>{paymentStatus}</div> : null}
                            </div>
                        </div>
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
                            <Image
                                src="/images/carter.jpg"
                                alt="Carter Moyer smiling"
                                fill
                                sizes="(max-width: 900px) 100vw, 40vw"
                                className={styles.portraitPhoto}
                            />
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
                        <h2 className={styles.sectionTitle}>Quick contact</h2>
                        <p className={styles.sectionSubtitle}>
                            Texting is the fastest way to reach me. You can also email and I’ll respond ASAP.
                        </p>
                    </div>
                    <div className={styles.contactGrid}>
                        <div className={styles.formCard}>
                            <h3 className="title is-5">Contact details</h3>
                            <div>
                                <strong>Phone:</strong> <span className="has-text-grey">920-904-2695</span>
                            </div>
                            <div>
                                <strong>Email:</strong> <span className="has-text-grey">cartermoyer75@gmail.com</span>
                            </div>
                            <div>
                                <strong>Service area:</strong> <span className="has-text-grey">Local neighborhoods within 15 miles</span>
                            </div>
                            <div className={styles.policyNote}>
                                Drive fee policy: Trips over 30 minutes one-way require a 50% drive-fee deposit. Trips over 60
                                minutes one-way require 50% of the total (snow removal + drive fee) upfront. Deposits are
                                non‑refundable if cancelled. A 10% convenience upcharge applies to requests within 3 business days.
                                I may cancel or decline any request before work begins; if I cancel, you will not be charged.
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
                    <span className={styles.footerDivider}>•</span>
                    <a className={styles.linkButton} href="/terms">Terms & conditions</a>
                </div>
            </footer>
        </main>
    );
}
