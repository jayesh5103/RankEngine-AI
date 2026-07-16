import os

# Synchronously set mock environment variables at the top of test suite to pass Pydantic validation checks
os.environ["MONGODB_URI"] = "mongodb://localhost:27017/test_rankengine"
os.environ["REDIS_URL"] = "redis://localhost:6379"
os.environ["LLM_API_KEY"] = "mock-llm-api-key"
os.environ["PLAYWRIGHT_HEADLESS"] = "True"

import pytest
import asyncio
from unittest.mock import AsyncMock, patch
from crawler import run_migration_check

pytestmark = pytest.mark.asyncio

async def test_migration_check_redirect_scenarios():
    # Factory to create fresh, concurrent-safe mock page instances with URL-based behaviors
    def create_mock_page():
        page = AsyncMock()
        
        async def mock_goto(url, *args, **kwargs):
            url_clean = url.rstrip('/')
            print(f"DEBUG mock_goto: URL={url} url_clean={url_clean}", flush=True)
            
            resp = AsyncMock()
            resp.status = 200
            resp.url = url
            
            req = AsyncMock()
            req.url = url
            req.redirected_from = None
            resp.request = req
            
            html = ""
            
            # Production harvests URL cases
            if url_clean == "https://live.com":
                html = '<html><body><a href="/about">About</a><a href="/contact">Contact</a></body></html>'
                print(f"DEBUG mock_goto: MATCH live.com html length={len(html)}", flush=True)
            elif url_clean == "https://live.com/about":
                html = '<html><body>About Us Content</body></html>'
                print(f"DEBUG mock_goto: MATCH live.com/about html length={len(html)}", flush=True)
            elif url_clean == "https://live.com/contact":
                html = '<html><body>Contact Page Content</body></html>'
                print(f"DEBUG mock_goto: MATCH live.com/contact html length={len(html)}", flush=True)
                
            # Staging redirect test cases
            elif url_clean == "https://staging.com":
                # Scenario A: Correct redirect
                req_orig = AsyncMock()
                req_orig.url = "https://staging.com"
                req_orig.redirected_from = None
                
                orig_resp = AsyncMock()
                orig_resp.status = 301
                req_orig.response = AsyncMock(return_value=orig_resp)
                
                req.redirected_from = req_orig
                req.url = "https://live.com"
                resp.url = "https://live.com"
            elif url_clean == "https://staging.com/about":
                # Scenario B: Missing redirect (returns 200 OK directly)
                resp.status = 200
                resp.url = "https://staging.com/about"
            elif url_clean == "https://staging.com/contact":
                # Scenario C: Wrong target redirect (redirects to wrong destination url)
                req_orig = AsyncMock()
                req_orig.url = "https://staging.com/contact"
                req_orig.redirected_from = None
                
                orig_resp = AsyncMock()
                orig_resp.status = 301
                req_orig.response = AsyncMock(return_value=orig_resp)
                
                req.redirected_from = req_orig
                req.url = "https://live.com/wrong"
                resp.url = "https://live.com/wrong"
                
            page.content = AsyncMock(return_value=html)
            return resp
            
        page.goto = AsyncMock(side_effect=mock_goto)
        page.close = AsyncMock()
        return page

    def create_mock_context():
        context = AsyncMock()
        context.new_page = AsyncMock(side_effect=create_mock_page)
        context.close = AsyncMock()
        return context

    browser = AsyncMock()
    browser.new_context = AsyncMock(side_effect=create_mock_context)

    with patch("crawler.async_playwright") as mock_pw:
        pw_context = AsyncMock()
        pw_context.chromium.launch = AsyncMock(return_value=browser)
        mock_pw.return_value.__aenter__ = AsyncMock(return_value=pw_context)

        # Setup mock db collections to assert records written
        mock_auditissues = AsyncMock()
        mock_crawlresults = AsyncMock()
        mock_crawljobs = AsyncMock()

        with patch("crawler.db") as mock_db:
            mock_db.auditissues = mock_auditissues
            mock_db.crawlresults = mock_crawlresults
            mock_db.crawljobs = mock_crawljobs

            # Run migration check
            await run_migration_check(
                "507f1f77bcf86cd799439011",
                "https://live.com",
                "https://staging.com"
            )

            # Assertions
            # 1. Verify CrawlResult document insert is triggered
            assert mock_crawlresults.insert_one.call_count == 1
            result_arg = mock_crawlresults.insert_one.call_args[0][0]
            assert len(result_arg["pages"]) == 3
            assert result_arg["type"] == "migration-check"

            # Check individual redirect target statuses
            pages = result_arg["pages"]
            home_check = next(p for p in pages if p["url"] == "https://staging.com")
            about_check = next(p for p in pages if p["url"] == "https://staging.com/about")
            contact_check = next(p for p in pages if p["url"] == "https://staging.com/contact")

            assert home_check["status"] == "passed"
            assert about_check["status"] == "failed"
            assert about_check["issueType"] == "missing_redirect"

            assert contact_check["status"] == "failed"
            assert contact_check["issueType"] == "wrong_target"

            # 2. Verify AuditIssue documents insertions
            assert mock_auditissues.insert_many.call_count == 1
            issues_inserted = mock_auditissues.insert_many.call_args[0][0]
            assert len(issues_inserted) == 2

            missing_issue = next(i for i in issues_inserted if i["url"] == "https://staging.com/about")
            wrong_issue = next(i for i in issues_inserted if i["url"] == "https://staging.com/contact")

            assert "returned status 200 instead of a 301 or 308 redirect" in missing_issue["description"]
            assert "redirected to https://live.com/wrong" in wrong_issue["description"]
            assert missing_issue["severity"] == "critical"
            assert wrong_issue["severity"] == "critical"
