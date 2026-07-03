export type ProjectSlug = "barracuda" | "ai-threat-detection" | "oracle-db-security";

export interface Project {
  slug: ProjectSlug;
  title: string;
  meta: string;
  image: string;
  imageAlt: string;
  photo: string;
  depthMap: string;
  signal: string;
  environment: string;
  outcome: string;
  severity: "High" | "Medium" | "Low";
  detectionLogic: {
    observe: string;
    investigate: string;
    respond: string;
  };
  impact: string[];
  summary: string;
  tags: string[];
  source?: string;
  details: string[];
  caseStudy: {
    problem: string;
    environment: string[];
    actions: string[];
    result: string;
    learned: string;
  };
}

export const projects: Project[] = [
  {
    slug: "barracuda",
    title: "Barracuda WAF Security Lab",
    meta: "Feb 2025 – Apr 2025 • Individual Researcher",
    image: "/images/project-waf.svg",
    photo: "/images/photo-waf.jpg",
    depthMap: "/images/depth-waf.jpg",
    imageAlt: "Hexagonal firewall shield grid deflecting incoming attack traffic",
    signal: "Web attack telemetry",
    environment: "DVWA + Barracuda WAF + SMTP alerting",
    outcome: "Repeatable WAF tuning and evidence collection flow",
    severity: "High",
    detectionLogic: {
      observe: "HTTP request pattern, WAF rule hit, source IP behavior",
      investigate: "Validate attack type, target path, request frequency, and block evidence",
      respond: "Tune WAF policy, forward notable events, document recommended action",
    },
    impact: ["Blocked simulated web attacks", "Built email alerting", "Practiced on-prem WAF tuning"],
    summary:
      "Deployed DVWA behind a Barracuda Web Application Firewall and tuned WAF rules to detect and block simulated attacks.",
    tags: ["Barracuda WAF", "DVWA", "DDoS", "XSS", "SMTP", "On-Prem"],
    details: [
      "Deployed DVWA (Damn Vulnerable Web App) behind Barracuda Web Application Firewall",
      "Simulated real-world attacks: DDoS, XSS, file upload bypass, and more",
      "Configured WAF rules to detect and block attacks",
      "Integrated an alert system to send real-time notifications via email using Python SMTP (port 587, 465)",
      "Developed automated Python scripts to send alerts via API and monitor suspicious activities",
      "Understood on-premise WAF setup, alert forwarding, and security policy tuning",
    ],
    caseStudy: {
      problem: "Practice how a SOC analyst validates web attack attempts behind a WAF instead of only trusting a block count.",
      environment: ["DVWA target", "Barracuda Web Application Firewall", "SMTP alerting", "On-prem style lab"],
      actions: [
        "Placed DVWA behind Barracuda WAF and tuned policies for simulated DDoS, XSS, and upload-bypass attempts",
        "Generated attack traffic, reviewed WAF events, and mapped alert context to attack type",
        "Built Python SMTP alerting so notable activity could be forwarded quickly",
      ],
      result: "Produced a repeatable lab flow for WAF policy tuning, alert verification, and evidence collection.",
      learned: "A useful alert needs context: request pattern, rule triggered, source behavior, and recommended next action.",
    },
  },
  {
    slug: "ai-threat-detection",
    title: "AI-based Unsupervised Threat Detection",
    meta: "Jul 2025 – Sep 2025 • Research Developer (Capstone)",
    image: "/images/project-ml.svg",
    photo: "/images/photo-ml.jpg",
    depthMap: "/images/depth-ml.jpg",
    imageAlt: "Network graph of events with one glowing pink anomaly node",
    signal: "Authentication and SQLi anomalies",
    environment: "Wazuh + pfSense + Python ML pipeline",
    outcome: "Anomaly scoring workflow with analyst-readable context",
    severity: "Medium",
    detectionLogic: {
      observe: "Authentication events, HTTP features, Wazuh alerts, firewall telemetry",
      investigate: "Compare anomaly scores with raw event context and suspicious time windows",
      respond: "Surface likely brute-force or SQLi patterns for analyst review",
    },
    impact: ["Detected brute-force and SQLi patterns", "Used Wazuh + pfSense telemetry", "Built anomaly scoring workflow"],
    summary:
      "Detect Brute Force and SQL Injection (SQLi) using unsupervised ML, enriched by Wazuh and pfSense telemetry.",
    tags: ["Python", "Scikit-learn", "Isolation Forest", "Autoencoder", "Wazuh (SIEM)", "pfSense", "Flask"],
    source: "https://github.com/TuanSOC/ProJect-AI-Unsupervised",
    details: [
      "Designed and implemented a capstone project for detecting Brute-Force and SQL Injection (SQLi) attacks using unsupervised machine learning",
      "Targeted real-world network and web attack scenarios",
      "Integrated Wazuh as a centralized security management and log aggregation (SIEM) platform",
      "Extracted and engineered features from Wazuh alerts, authentication logs, HTTP request logs, and network traffic",
      "Applied Isolation Forest and Autoencoder models to identify anomalous behavior patterns without labeled attack data",
      "Developed a lightweight Flask-based API/dashboard to visualize detected anomalies and security alerts",
    ],
    caseStudy: {
      problem: "Explore how anomaly detection can identify brute-force and SQLi-like behavior when labeled attack data is limited.",
      environment: ["Wazuh SIEM", "pfSense telemetry", "Python", "Scikit-learn", "Isolation Forest", "Autoencoder"],
      actions: [
        "Collected and normalized authentication, HTTP, and network security events",
        "Engineered features from Wazuh alerts and firewall telemetry for unsupervised models",
        "Compared anomaly scores and reviewed suspicious patterns through a lightweight dashboard/API",
      ],
      result: "Built an end-to-end proof of concept for surfacing suspicious authentication and SQLi patterns.",
      learned: "ML detection is most useful when paired with analyst-readable context and clear false-positive review.",
    },
  },
  {
    slug: "oracle-db-security",
    title: "Oracle SQL Database Security",
    meta: "Security Lab • On-Prem",
    image: "/images/project-db.svg",
    photo: "/images/photo-db.jpg",
    depthMap: "/images/depth-db.jpg",
    imageAlt: "Locked database cylinder rejecting unauthorized query attempts",
    signal: "Database access risk",
    environment: "Oracle SQL + auditing + injection test cases",
    outcome: "Least-privilege and audit visibility improvements",
    severity: "Medium",
    detectionLogic: {
      observe: "User privileges, audit records, SQL injection test behavior",
      investigate: "Review excessive access, query activity, and control gaps",
      respond: "Apply least privilege, enable auditing, document hardening actions",
    },
    impact: ["Enforced least privilege", "Enabled auditing", "Tested SQL injection risk"],
    summary:
      "Hardened Oracle SQL access controls and auditing to reduce risk from SQL injection and unauthorized queries.",
    tags: ["Oracle SQL", "SQL Injection", "Least Privilege", "Auditing", "Hardening"],
    details: [
      "Implemented database-level security controls on Oracle SQL",
      "Configured user access management, roles, and privileges to enforce least-privilege principle",
      "Enabled auditing of user activities and DML/DQL events",
      "Tested for SQL injection vulnerabilities and applied best practices for hardening",
      "Simulated unauthorized access attempts and monitored logs for anomalies",
      "Compared with MySQL to understand cross-platform security configurations",
    ],
    caseStudy: {
      problem: "Reduce database risk from excessive privileges, weak auditing, and SQL injection testing scenarios.",
      environment: ["Oracle SQL", "Role-based access", "Auditing", "SQL injection test cases", "On-prem lab"],
      actions: [
        "Created role-based access controls and reviewed user privileges against least-privilege principles",
        "Enabled auditing for key user actions and query activity",
        "Tested SQL injection scenarios and documented hardening recommendations",
      ],
      result: "Improved database security posture through clearer access boundaries and audit visibility.",
      learned: "Database hardening is strongest when access design, query testing, and audit review are treated together.",
    },
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
