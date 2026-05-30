#!/usr/bin/env python3
"""Build _data/publication_figures.yml from OpenAlex + PubMed Central."""

from __future__ import annotations

import html
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "_data" / "publication_figures.yml"
MAILTO = "contact@lab.uw.edu.pl"
AUTHOR_SEARCH = (
    "https://api.openalex.org/authors?"
    "search=Joanna+Sulkowska&filter=last_known_institutions.country_code:PL"
    f"&per-page=5&mailto={MAILTO}"
)
HEADERS = {"User-Agent": f"ilbsm.github.io figure updater ({MAILTO})"}

MANUAL_FALLBACKS = [
    {
        "doi": "10.1093/nar/gkaf375",
        "match": "alphalasso",
        "label": "AlphaLasso",
        "figures": [
            {
                "img": "https://cdn.ncbi.nlm.nih.gov/pmc/blobs/b4ea/12230674/901aa05b0687/gkaf375figgra1.jpg",
                "href": "https://pmc.ncbi.nlm.nih.gov/articles/PMC12230674/figure/ga1/",
                "alt": "Graphical Abstract.",
                "caption": "Graphical Abstract.",
            },
            {
                "img": "https://cdn.ncbi.nlm.nih.gov/pmc/blobs/b4ea/12230674/ad0c04a44764/gkaf375fig1.jpg",
                "href": "https://pmc.ncbi.nlm.nih.gov/articles/PMC12230674/figure/F1/",
                "alt": "Figure 1.",
                "caption": "Figure 1. Distribution of distances between bonded and non-bonded atom pairs.",
            },
            {
                "img": "https://cdn.ncbi.nlm.nih.gov/pmc/blobs/b4ea/12230674/3b3313548d72/gkaf375fig2.jpg",
                "href": "https://pmc.ncbi.nlm.nih.gov/articles/PMC12230674/figure/F2/",
                "alt": "Figure 2.",
                "caption": "Figure 2. Submission options.",
            },
            {
                "img": "https://cdn.ncbi.nlm.nih.gov/pmc/blobs/b4ea/12230674/5f014a11c077/gkaf375fig3.jpg",
                "href": "https://pmc.ncbi.nlm.nih.gov/articles/PMC12230674/figure/F3/",
                "alt": "Figure 3.",
                "caption": "Figure 3. Protein analysis result.",
            },
            {
                "img": "https://cdn.ncbi.nlm.nih.gov/pmc/blobs/b4ea/12230674/8498f5d942c7/gkaf375fig4.jpg",
                "href": "https://pmc.ncbi.nlm.nih.gov/articles/PMC12230674/figure/F4/",
                "alt": "Figure 4.",
                "caption": "Figure 4. Proteins with a new lasso type.",
            }
        ],
    },
    {
        "doi": "10.1093/nar/gkae443",
        "match": "alphaknot 2.0",
        "label": "AlphaKnot 2.0",
        "figures": [
            {
                "img": "/assets/img/software/alphaknot.png",
                "alt": "AlphaKnot 2.0 web server figure",
                "caption": "AlphaKnot 2.0 visualization server",
            }
        ],
    },
    {
        "doi": "10.1093/nar/gkac388",
        "match": "alphaknot",
        "label": "AlphaKnot",
        "figures": [
            {
                "img": "/assets/img/software/alphaknot.png",
                "alt": "AlphaKnot web server figure",
                "caption": "AlphaKnot server",
            }
        ],
    },
    {
        "doi": "10.1093/nar/gku1059",
        "match": "knotprot",
        "label": "KnotProt",
        "figures": [
            {
                "img": "/assets/img/software/knotprot.jpg",
                "alt": "KnotProt database figure",
                "caption": "KnotProt database",
            }
        ],
    },
    {
        "match": "lassoprot",
        "label": "LassoProt",
        "figures": [
            {
                "img": "/assets/img/software/lassoprot.jpg",
                "alt": "LassoProt database figure",
                "caption": "LassoProt database",
            }
        ],
    },
    {
        "match": "linkprot",
        "label": "LinkProt",
        "figures": [
            {
                "img": "/assets/img/software/linkprot.png",
                "alt": "LinkProt database figure",
                "caption": "LinkProt database",
            }
        ],
    },
    {
        "match": "pylasso",
        "label": "PyLasso",
        "figures": [
            {
                "img": "/assets/img/software/pylasso.png",
                "alt": "PyLasso plugin figure",
                "caption": "PyLasso plugin",
            }
        ],
    },
    {
        "doi": "10.1073/pnas.1207864109",
        "match": "genomics-aided structure prediction",
        "label": "Genomics-aided structure prediction",
        "figures": [
            {
                "img": "/assets/img/research/Picture3.png",
                "alt": "DCA pipeline figure",
                "caption": "DCA pipeline: MSA to structure prediction",
            },
            {
                "img": "/assets/img/research/bioinf2.png",
                "alt": "MSA contact map figure",
                "caption": "MSA alignment, conservation, and contact map prediction",
            },
        ],
    },
    {
        "doi": "10.1073/pnas.1205918109",
        "match": "conservation of complex knotting",
        "label": "Complex knotting and slipknotting patterns",
        "figures": [
            {
                "img": "/assets/img/research/math1.png",
                "alt": "Knotted and slipknotted protein types",
                "caption": "Knotted and slipknotted protein types",
            }
        ],
    },
    {
        "doi": "10.1093/nar/gkz845",
        "match": "genus for biomolecules",
        "label": "Genus for biomolecules",
        "figures": [
            {
                "img": "/assets/img/research/math2.png",
                "alt": "Seifert surface and topological linking figure",
                "caption": "Seifert surface and topological linking",
            }
        ],
    },
    {
        "doi": "10.1093/nar/gky1140",
        "match": "knotprot 2.0",
        "label": "KnotProt 2.0",
        "figures": [
            {
                "img": "/assets/img/research/chem1.png",
                "alt": "Knotted and unknotted fold comparison",
                "caption": "Knotted fold vs. unknotted fold",
            }
        ],
    },
    {
        "doi": "10.1073/pnas.0805468105",
        "match": "stabilizing effect of knots",
        "label": "Stabilizing effect of knots",
        "figures": [
            {
                "img": "/assets/img/research/chem2.png",
                "alt": "Antimicrobial drug target figure",
                "caption": "Antimicrobial drug targets",
            }
        ],
    },
]

EXTRA_DOI_SEEDS = [
    "10.1016/j.bpj.2023.10.031",
    "10.1038/s41598-019-47999-4",
    "10.1073/pnas.1207864109",
    "10.1093/nar/gkw976",
    "10.1371/journal.pcbi.1011959",
    "10.1371/journal.pone.0045654",
    "10.1529/biophysj.107.105973",
    "10.3390/polym11040707",
    "10.3390/polym9090454",
]

EXTRA_PMC_SEEDS = [
    ("10.1002/prot.21652", "PMC2580773"),
    ("10.1016/j.bpj.2014.10.021", "PMC4269773"),
    ("10.1016/j.bpj.2023.10.031", "PMC10719070"),
    ("10.1021/acscatal.0c00059", "PMC7462349"),
    ("10.1021/jz301893w", "PMC3601837"),
    ("10.1038/s41598-019-47999-4", "PMC6692345"),
    ("10.1073/pnas.0811147106", "PMC2651233"),
    ("10.1073/pnas.1205918109", "PMC3387036"),
    ("10.1073/pnas.1207864109", "PMC3387073"),
    ("10.1073/pnas.2525920123", "PMC13123833"),
    ("10.1093/nar/gkaf375", "PMC12230674"),
    ("10.1093/nar/gku1059", "PMC4383900"),
    ("10.1093/nar/gkw308", "PMC4987892"),
    ("10.1093/nar/gkw976", "PMC5210653"),
    ("10.1093/nar/gky511", "PMC6030981"),
    ("10.1371/journal.pcbi.1000731", "PMC2848546"),
    ("10.1371/journal.pcbi.1003613", "PMC4063663"),
    ("10.1371/journal.pcbi.1005970", "PMC5874080"),
    ("10.1371/journal.pcbi.1011959", "PMC11218946"),
    ("10.1371/journal.pone.0045654", "PMC3454405"),
    ("10.1371/journal.pone.0176744", "PMC5425179"),
    ("10.1529/biophysj.107.105973", "PMC2134851"),
    ("10.3390/ijms22083957", "PMC8069282"),
    ("10.3390/polym11040707", "PMC6523798"),
    ("10.3390/polym9090454", "PMC6418553"),
]


def fetch_text(url: str, *, retries: int = 3) -> str:
    last_error: Exception | None = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=30) as response:
                charset = response.headers.get_content_charset() or "utf-8"
                return response.read().decode(charset, errors="replace")
        except Exception as exc:  # pragma: no cover - network helper
            last_error = exc
            time.sleep(0.6 + attempt)
    raise RuntimeError(f"Could not fetch {url}: {last_error}")


def fetch_json(url: str) -> dict:
    return json.loads(fetch_text(url))


def normalise_doi(raw: str | None) -> str:
    return (raw or "").strip().lower().replace("https://doi.org/", "").replace("doi:", "")


def text_from_html(raw: str) -> str:
    text = re.sub(r"<script\b.*?</script>", " ", raw, flags=re.I | re.S)
    text = re.sub(r"<style\b.*?</style>", " ", text, flags=re.I | re.S)
    text = re.sub(r"<[^>]+>", " ", text)
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def first_sentenceish(raw: str, limit: int = 280) -> str:
    text = text_from_html(raw)
    if len(text) <= limit:
        return text
    cut = text[:limit].rsplit(" ", 1)[0].strip()
    return f"{cut}..."


def pmc_id_from_work(work: dict) -> str | None:
    urls: list[str] = []
    for key in ("primary_location", "best_oa_location"):
        loc = work.get(key) or {}
        urls.extend(str(loc.get(field) or "") for field in ("landing_page_url", "pdf_url"))
    for loc in work.get("locations") or []:
        urls.extend(str(loc.get(field) or "") for field in ("landing_page_url", "pdf_url"))
        if str(loc.get("id") or "").startswith("pmh:oai:pubmedcentral.nih.gov:"):
            urls.append(loc["id"].rsplit(":", 1)[-1])

    for url in urls:
        match = re.search(r"(?:PMC)?(\d{5,})", url, flags=re.I)
        if match and ("pmc" in url.lower() or str(url).isdigit()):
            return f"PMC{match.group(1)}"
    return None


def find_attr(tag: str, name: str) -> str:
    match = re.search(rf"\b{name}=(['\"])(.*?)\1", tag, flags=re.I | re.S)
    return html.unescape(match.group(2)) if match else ""


def extract_pmc_figures(pmcid: str) -> list[dict]:
    url = f"https://pmc.ncbi.nlm.nih.gov/articles/{pmcid}/"
    page = fetch_text(url)
    figures: list[dict] = []
    seen_images: set[str] = set()

    for match in re.finditer(r"<figure\b(?P<tag>[^>]*)>(?P<body>.*?)</figure>", page, flags=re.I | re.S):
        tag = match.group("tag")
        body = match.group("body")
        if "fig" not in find_attr(tag, "class").split():
            continue

        img_match = re.search(r"<img\b(?P<tag>[^>]*\bclass=(['\"])[^'\"]*\bgraphic\b[^'\"]*\2[^>]*)>", body, flags=re.I | re.S)
        if not img_match:
            img_match = re.search(r"<img\b(?P<tag>[^>]*)>", body, flags=re.I | re.S)
        if not img_match:
            continue

        img_tag = img_match.group("tag")
        src = find_attr(img_tag, "src")
        if not src or src in seen_images:
            continue
        seen_images.add(src)

        figure_id = find_attr(tag, "id")
        head_match = re.search(r"<h[1-6]\b[^>]*>(.*?)</h[1-6]>", body, flags=re.I | re.S)
        head = text_from_html(head_match.group(1)) if head_match else find_attr(img_tag, "alt") or "Figure"
        caption_match = re.search(r"<figcaption\b[^>]*>(.*?)</figcaption>", body, flags=re.I | re.S)
        caption = first_sentenceish(caption_match.group(1) if caption_match else head)
        label = f"{head} {caption}".strip() if caption and caption != head else head
        href = f"https://pmc.ncbi.nlm.nih.gov/articles/{pmcid}/figure/{figure_id}/" if figure_id else url

        figures.append(
            {
                "img": src,
                "alt": head,
                "caption": label,
                "href": href,
            }
        )

    return figures


def openalex_works() -> list[dict]:
    authors = fetch_json(AUTHOR_SEARCH).get("results") or []
    if not authors:
        raise RuntimeError("Could not find Joanna Sulkowska in OpenAlex")
    author = sorted(authors, key=lambda row: row.get("cited_by_count") or 0, reverse=True)[0]
    author_id = author["id"].replace("https://openalex.org/", "")

    works: list[dict] = []
    works_by_id: dict[str, dict] = {}
    seen_ids: set[str] = set()
    cursor = "*"
    for _ in range(4):
        url = (
            "https://api.openalex.org/works?"
            f"filter=author.id:{author_id}"
            f"&sort=cited_by_count:desc&per-page=100&cursor={urllib.parse.quote(cursor)}"
            f"&mailto={MAILTO}"
        )
        data = fetch_json(url)
        batch = data.get("results") or []
        if not batch:
            break
        for work in batch:
            work_id = work.get("id")
            if work_id and work_id in seen_ids:
                continue
            if work_id:
                seen_ids.add(work_id)
                works_by_id[work_id] = work
            works.append(work)
        cursor = data.get("meta", {}).get("next_cursor")
        if not cursor:
            break
        time.sleep(0.12)

    # Some fresh low-citation papers may lag in paginated author lists but are
    # known through the local fallback map. Pull their canonical records too.
    seed_dois = {normalise_doi(item.get("doi")) for item in MANUAL_FALLBACKS if item.get("doi")}
    seed_dois.update(EXTRA_DOI_SEEDS)
    for doi in sorted(seed_dois):
        url = f"https://api.openalex.org/works/https://doi.org/{doi}?mailto={MAILTO}"
        try:
            work = fetch_json(url)
        except Exception:
            continue
        work_id = work.get("id")
        if work_id:
            if work_id in works_by_id:
                index = next((i for i, item in enumerate(works) if item.get("id") == work_id), None)
                if index is not None:
                    works[index] = work
            else:
                seen_ids.add(work_id)
                works.append(work)
            works_by_id[work_id] = work
        time.sleep(0.12)
    return works


def yaml_scalar(value: object) -> str:
    return json.dumps("" if value is None else str(value), ensure_ascii=True)


def write_yaml(entries: list[dict]) -> None:
    lines: list[str] = [
        "# Generated by scripts/update_publication_figures.py.",
        "# PubMed Central figures are indexed from open full-text article pages.",
        "",
    ]
    for entry in entries:
        lines.append(f"- doi: {yaml_scalar(entry.get('doi', ''))}")
        if entry.get("openalex"):
            lines.append(f"  openalex: {yaml_scalar(entry['openalex'])}")
        if entry.get("pmc"):
            lines.append(f"  pmc: {yaml_scalar(entry['pmc'])}")
        if entry.get("match"):
            lines.append(f"  match: {yaml_scalar(entry['match'])}")
        lines.append(f"  label: {yaml_scalar(entry.get('label', ''))}")
        if entry.get("source"):
            lines.append(f"  source: {yaml_scalar(entry['source'])}")
        lines.append("  figures:")
        for fig in entry.get("figures") or []:
            lines.append(f"    - img: {yaml_scalar(fig.get('img', ''))}")
            if fig.get("href"):
                lines.append(f"      href: {yaml_scalar(fig['href'])}")
            lines.append(f"      alt: {yaml_scalar(fig.get('alt', ''))}")
            lines.append(f"      caption: {yaml_scalar(fig.get('caption', ''))}")
        lines.append("")
    OUT.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    generated: list[dict] = []
    seen_dois: set[str] = set()
    works = openalex_works()
    works_by_doi = {normalise_doi(work.get("doi")): work for work in works if normalise_doi(work.get("doi"))}

    def add_pmc_entry(doi: str, pmcid: str, work: dict | None) -> None:
        doi = normalise_doi(doi)
        if not doi or doi in seen_dois:
            return
        try:
            figures = extract_pmc_figures(pmcid)
        except Exception as exc:
            print(f"skip {doi} {pmcid}: {exc}")
            return
        if not figures:
            return
        generated.append(
            {
                "doi": doi,
                "openalex": str((work or {}).get("id", "")).replace("https://openalex.org/", ""),
                "pmc": pmcid,
                "label": (work or {}).get("title") or doi,
                "source": "PubMed Central",
                "figures": figures,
            }
        )
        seen_dois.add(doi)
        print(f"{doi}: {len(figures)} figures from {pmcid}")
        time.sleep(0.18)

    for work in works:
        doi = normalise_doi(work.get("doi"))
        pmcid = pmc_id_from_work(work)
        if not doi or not pmcid:
            continue
        add_pmc_entry(doi, pmcid, work)

    for doi, pmcid in EXTRA_PMC_SEEDS:
        add_pmc_entry(doi, pmcid, works_by_doi.get(normalise_doi(doi)))

    for fallback in MANUAL_FALLBACKS:
        doi = normalise_doi(fallback.get("doi"))
        if doi and doi in seen_dois:
            continue
        generated.append(fallback)

    generated.sort(key=lambda item: (0 if item.get("source") == "PubMed Central" else 1, item.get("doi") or item.get("match") or ""))
    write_yaml(generated)
    print(f"Wrote {len(generated)} figure entries to {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
