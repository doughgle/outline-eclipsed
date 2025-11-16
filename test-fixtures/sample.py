# Test Python file for PI-9: Description and Tooltip validation
# This file tests outline items with description and tooltip for Python symbols

"""
Main application module
Demonstrates class and function symbols in outline
"""


class Application:
    """
    Main application class
    Handles application lifecycle and configuration
    """

    def __init__(self, name: str, version: str):
        """Initialize the application"""
        self.name = name
        self.version = version
        self._running = False

    def get_name(self) -> str:
        """Get the application name"""
        return self.name

    def set_name(self, name: str) -> None:
        """Set the application name"""
        self.name = name

    def start(self) -> None:
        """Start the application"""
        self._running = True
        print(f"Starting {self.name} v{self.version}")

    def stop(self) -> None:
        """Stop the application"""
        self._running = False
        print(f"Stopping {self.name}")


class ApiService:
    """
    Service class for API operations
    Handles HTTP requests and responses
    """

    def __init__(self, api_key: str, timeout: int = 5000):
        """Initialize the API service"""
        self.api_key = api_key
        self.timeout = timeout
        self.retries = 3

    async def fetch_data(self, endpoint: str) -> dict:
        """
        Fetch data from API endpoint
        
        Args:
            endpoint: The API endpoint to fetch from
            
        Returns:
            Dictionary containing the response data
        """
        # Implementation here
        return {}

    async def post_data(self, endpoint: str, data: dict) -> None:
        """
        Post data to API endpoint
        
        Args:
            endpoint: The API endpoint to post to
            data: The data to post
        """
        # Implementation here
        pass


def format_message(message: str, prefix: str = None) -> str:
    """
    Format a message with optional prefix
    
    Args:
        message: The message to format
        prefix: Optional prefix to add
        
    Returns:
        Formatted message string
    """
    if prefix:
        return f"{prefix}: {message}"
    return message


# Module-level constants
DEFAULT_TIMEOUT = 5000
MAX_RETRIES = 3
API_VERSION = "v1"
