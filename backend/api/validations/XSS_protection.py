import bleach
from pydantic import GetCoreSchemaHandler
from pydantic_core import core_schema

class SafeStr(str):
    @classmethod
    def __get_pydantic_core_schema__(cls, _source_type, _handler: GetCoreSchemaHandler) -> core_schema.CoreSchema:
        return core_schema.no_info_after_validator_function(
            cls.sanitize,
            core_schema.str_schema()
        )

    @staticmethod
    def sanitize(value: str) -> str:
        if not isinstance(value, str):
            raise TypeError("Expected a string")
        # Sanitize by removing all HTML/JS tags
        return bleach.clean(value, tags=[], strip=True)