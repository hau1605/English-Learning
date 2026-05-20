from typing import Optional
from bs4 import BeautifulSoup, Tag
import structlog

logger = structlog.get_logger()


class HTMLParser:
    @staticmethod
    def parse(html: str) -> BeautifulSoup:
        return BeautifulSoup(html, "lxml")

    @staticmethod
    def extract_text(element: Tag, selector: str) -> Optional[str]:
        found = element.select_one(selector)
        return found.get_text(strip=True) if found else None

    @staticmethod
    def extract_texts(element: Tag, selector: str) -> list[str]:
        found = element.select(selector)
        return [f.get_text(strip=True) for f in found if f.get_text(strip=True)]

    @staticmethod
    def extract_attribute(element: Tag, selector: str, attr: str) -> Optional[str]:
        found = element.select_one(selector)
        return found.get(attr) if found else None

    @staticmethod
    def extract_attributes(
        element: Tag, selector: str, attr: str
    ) -> list[Optional[str]]:
        found = element.select(selector)
        return [f.get(attr) for f in found]

    @staticmethod
    def extract_links(element: Tag, selector: str = "a") -> list[dict]:
        links = []
        for a in element.select(selector):
            href = a.get("href")
            text = a.get_text(strip=True)
            if href:
                links.append({"url": href, "text": text})
        return links

    @staticmethod
    def extract_table_rows(element: Tag, table_selector: str = "table") -> list[dict]:
        table = element.select_one(table_selector)
        if not table:
            return []

        rows = []
        headers = []
        for i, tr in enumerate(table.select("tr")):
            cells = [td.get_text(strip=True) for td in tr.select("td, th")]
            if i == 0:
                headers = cells
            else:
                row_dict = dict(zip(headers, cells))
                rows.append(row_dict)
        return rows

    @staticmethod
    def extract_json_ld(element: Tag) -> Optional[dict]:
        scripts = element.select('script[type="application/ld+json"]')
        import json

        for script in scripts:
            try:
                return json.loads(script.string)
            except (json.JSONDecodeError, TypeError):
                continue
        return None

    @staticmethod
    def clean_text(text: str) -> str:
        return " ".join(text.split())


class JSONParser:
    @staticmethod
    def parse(content: str) -> dict | list | None:
        import json

        try:
            return json.loads(content)
        except json.JSONDecodeError as e:
            logger.error("json_parse_error", error=str(e))
            return None

    @staticmethod
    def extract_field(data: dict | list, path: str, default=None):
        keys = path.split(".")
        result = data
        for key in keys:
            if isinstance(result, dict):
                result = result.get(key)
            elif isinstance(result, list):
                try:
                    result = result[int(key)]
                except (ValueError, IndexError):
                    return default
            else:
                return default
            if result is None:
                return default
        return result
